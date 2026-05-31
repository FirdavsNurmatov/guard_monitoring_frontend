import LanguageSwitcher from "../../components/common/LanguageSwitcher";
import MapView from "../../components/dashboard/MapView";
import JournalModal from "../../components/dashboard/JournalModal";
import { instance } from "../../config/axios-instance";
import { createSocket } from "../../config/socket";
import { useAuthStore } from "../../store/useAuthStore";
import { useObjectStore } from "../../store/useObjectStore";
import { useNotificationHandler } from "../../hooks/useNotificationHandler.jsx";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Button, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Shield, Image, FileText, Map, LayoutDashboard } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useGetObjects } from "../../services/query/AdminPanel/Dashboard/useGetObjects.js";
import { useGetObjectById } from "../../services/query/AdminPanel/Dashboard/useGetObjectById.js";
import { useGetLogs } from "../../services/query/AdminPanel/Dashboard/useGetLogs.js";
import { useGetJournalLogs } from "../../services/query/AdminPanel/Dashboard/useGetJournalLogs.js";

// Pulse animation for live indicator
const LiveIndicator = () => (
  <span className="relative flex h-3 w-3 mr-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
  </span>
);

const { Option } = Select;

const baseUrl = import.meta.env.VITE_SERVER_PORT;

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [socket, setSocket] = useState(null);
  const [selectedMap, setSelectedMap] = useState(null); // 🔹 tanlangan obyekt
  const [guards, setGuards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [journal, setJournal] = useState(false);
  const [journalLogs, setJournalLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [gpsPoints, setGpsPoints] = useState([]);
  const mapWrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuthStore((store) => store);
  const {
    selectedMapId,
    mapType,
    objectType,
    setSelectedMapId,
    setMapType,
    setObjectType,
  } = useObjectStore((store) => store);
  const navigate = useNavigate();

  // const audioRef = useRef(null);

  const handleLogReceived = useCallback((formattedLog, log) => {
    setLogs((prev) => [formattedLog, ...prev].slice(0, 50));

    setGuards((prev) => {
      const index = prev.findIndex((g) => g.guardId === log.userId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          checkpointName: log.checkpoint?.name,
          status: log.status,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            guardId: log.userId,
            login: log.user?.username,
            username: log.user?.username,
            checkpointName: log.checkpoint?.name,
            status: log.status,
          },
        ];
      }
    });
  }, []);

  useNotificationHandler(socket, selectedMap, i18n, t, handleLogReceived);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);

      // Leaflet map size yangilash
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!mapWrapperRef.current) return;

    if (!document.fullscreenElement) {
      await mapWrapperRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const { data: maps = [], isError: isGetObjectsError } = useGetObjects();

  useEffect(() => {
    if (isGetObjectsError) toast.error(t("dashboardPage.loadObjectsError"));
  }, [isGetObjectsError]);

  useEffect(() => {
    if (maps.length > 0 && !selectedMapId) {
      setSelectedMapId(maps[0].id);
    }
  }, [maps]);

  const {
    data: objectData,
    isError: objectError,
    isLoading,
  } = useGetObjectById(selectedMapId);

  useEffect(() => {
    if (objectData) {
      setSelectedMap({
        ...objectData,
        imageUrl: `${baseUrl}${objectData.imageUrl}`,
      });
    }
  }, [objectData]);

  useEffect(() => {
    if (objectError) toast.error(t("dashboardPage.loadObjectError"));
  }, [objectError]);

  // 🟢 Loglarni olish
  const { data: logsData = [] } = useGetLogs(selectedMapId);

  useEffect(() => {
    if (!logsData.length) return;

    setLogs(
      logsData.map((log) => ({
        id: log.id,
        guard: log.user?.username || log.user?.login,
        checkpoint: log.checkpoint?.name || "-",
        status: log.status,
        createdAt: new Date(log.createdAt).toLocaleTimeString(),
        createdAtRaw: new Date(log.createdAt),
        zoneId: log.checkpoint?.id,
        userId: log.userId,
      })),
    );

    const guardsArr = [];
    logsData.forEach((log) => {
      if (!log.userId) return;
      if (!guardsArr.some((g) => g.guardId === log.userId)) {
        guardsArr.push({
          guardId: log.userId,
          login: log.user?.login,
          username: log.user?.username,
          checkpointName: log.checkpoint?.name,
          status: log.status,
        });
      }
    });
    setGuards(guardsArr);
  }, [logsData]);

  // ✅ useGetJournalLogs
  const { data: journalData } = useGetJournalLogs({
    objectId: selectedMap?.id,
    page,
    enabled: journal,
  });

  useEffect(() => {
    if (!journalData) return;
    setJournalLogs(
      journalData.items.map((log) => ({
        id: log.id,
        guard: log.user?.username || log.user?.login,
        checkpoint: log.checkpoint?.name || "-",
        createdAtRaw: new Date(log.createdAt),
        status: log.status,
      })),
    );
    setTotal(journalData.total || 0);
  }, [journalData]);

  useEffect(() => {
    // Socket ulanishini yaratish
    const newSocket = createSocket();
    setSocket(newSocket);

    // Socket eventlari
    newSocket.on("connect", () => {
      console.log("✅ Connected", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
    });

    // Komponent unmounted bo'lganda socketni uzish
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    toast.dismiss();
  }, [i18n.language]);

  // 🛰️ GPS real-time yangilanishlar
  const handleGps = useCallback(
    async (msg) => {
      // Masalan: msg = "gps:3"
      if (!msg.startsWith("gps:")) return;

      const userId = msg.split(":")[1];
      try {
        const res = await instance.get(`/admin/gps/${userId}?limit=20`);
        const points = res.data.map((p) => [p.location?.lat, p.location?.lng]);
        setGpsPoints(points);
      } catch (err) {
        toast.error(t("dashboardPage.loadGpsError"));
      }
    },
    [t],
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("gps", handleGps);
    return () => {
      socket.off("gps", handleGps);
    };
  }, [socket, handleGps]);

  // 🔥 Eng so‘nggi loglarni zoneId bo‘yicha map qilib olamiz
  const latestLogsByZone = useMemo(() => {
    const map = {};
    for (const log of logs) {
      const existing = map[log.zoneId];

      if (!existing || log.createdAtRaw > existing.createdAtRaw) {
        map[log.zoneId] = log;
      }
    }
    return map;
  }, [logs]);

  // 📊 Stats calculations
  const stats = useMemo(() => {
    return {
      guardsCount: guards.length,
      onTimeCount: logs.filter((l) => l.status === "ON_TIME").length,
      lateCount: logs.filter(
        (l) => l.status === "LATE" || l.status === "VERY_LATE",
      ).length,
      lastLogTime: logs[0]?.createdAt?.split(",")[1]?.trim() || "--:--",
    };
  }, [guards, logs]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      <header className="bg-gray-900/80 backdrop-blur-xl border-gray-700/50 shadow-lg shadow-black/20 z-50 flex-shrink-0">
        <div className="px-4 py-2">
          <div>
            <div className="flex items-center justify-between">
              {/* Left */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {selectedMap?.name || "Monitoring"}
                  </h1>
                  <div className="flex items-center text-xs text-emerald-400">
                    <LiveIndicator />
                    <span>{t("dashboardPage.live")}</span>
                  </div>
                </div>
              </div>

              {/* Center */}
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-800 rounded-lg p-0.5">
                  <Button
                    type={objectType === "IMAGE" ? "primary" : "text"}
                    onClick={() => setObjectType("IMAGE")}
                    size="medium"
                    icon={<Image className="w-3.5 h-3.5" />}
                    className={
                      objectType === "IMAGE"
                        ? "btn-primary-green"
                        : "text-gray-300 hover:text-white"
                    }
                  >
                    {t("dashboardPage.image")}
                  </Button>
                  <Button
                    type={objectType === "MAP" ? "primary" : "text"}
                    onClick={() => setObjectType("MAP")}
                    className={
                      objectType === "MAP"
                        ? "btn-primary-green"
                        : "text-gray-300 hover:text-white"
                    }
                    size="medium"
                    icon={<Map className="w-3.5 h-3.5" />}
                  >
                    {t("dashboardPage.map")}
                  </Button>
                </div>

                <Select
                  size="medium"
                  placeholder={t("dashboardPage.object")}
                  value={selectedMapId || selectedMap?.id}
                  className="select-green"
                  style={{ width: 160 }}
                  onChange={(id) => {
                    setSelectedMapId(id);
                  }}
                >
                  {maps.map((item) => (
                    <Option key={item.id} value={item.id}>
                      {item.name}
                    </Option>
                  ))}
                </Select>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 mr-2">
                  <LanguageSwitcher />
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-1">
                <Button
                  size="medium"
                  type="primary"
                  icon={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => setJournal(true)}
                  className="btn-primary-green"
                >
                  {t("dashboardPage.journal")}
                </Button>
                {user?.role === "ADMIN" && (
                  <Button
                    size="medium"
                    icon={<Shield className="w-3.5 h-3.5" />}
                    onClick={() => navigate("/admin")}
                    className="btn-primary-green"
                  >
                    {t("dashboardPage.admin")}
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            {!isLoading && selectedMap && (
              <div className="flex items-center gap-4 mt-1.5 pt-1.5 border-t border-gray-700/50 text-xs">
                <span className="text-gray-400">
                  {t("dashboardPage.guards")}:{" "}
                  <b className="text-white">{stats.guardsCount}</b>
                </span>
                <span className="text-gray-400">
                  {t("dashboardPage.onTime")}:{" "}
                  <b className="text-emerald-400">{stats.onTimeCount}</b>
                </span>
                <span className="text-gray-400">
                  {t("dashboardPage.late")}:{" "}
                  <b className="text-amber-400">{stats.lateCount}</b>
                </span>
                <span className="ml-auto text-gray-500">
                  {stats.lastLogTime}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {!isLoading && selectedMap && (
        <>
          <MapView
            ref={mapWrapperRef}
            selectedMap={selectedMap}
            objectType={objectType}
            mapType={mapType}
            setMapType={setMapType}
            latestLogsByZone={latestLogsByZone}
            gpsPoints={gpsPoints}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            t={t}
          />

          <JournalModal
            open={journal}
            onCancel={() => setJournal(false)}
            journalLogs={journalLogs}
            page={page}
            setPage={setPage}
            total={total}
            t={t}
          />
        </>
      )}
    </div>
  );
}
