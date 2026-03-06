import React, { useEffect, useRef, useState } from "react";
import { Typography, Spin, Table, Button, Modal, Select } from "antd";
import { instance } from "../../config/axios-instance";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { socket } from "../../config/socket";
import toast from "react-hot-toast";
import Noty from "noty";
import "noty/lib/noty.css";
import "noty/src/themes/metroui.scss";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CheckpointMarker } from "../../components/CheckpointMarker";
import { useMemo } from "react";

const invisibleIcon = L.divIcon({
  className: "",
  html: `<div style="width:0;height:0;"></div>`,
  iconSize: [0, 0],
});

const { Title } = Typography;
const { Option } = Select;

export default function Dashboard() {
  const [maps, setMaps] = useState([]); // 🔹 barcha obyektlar
  const [selectedMap, setSelectedMap] = useState(null); // 🔹 tanlangan obyekt
  const [loading, setLoading] = useState(true);
  const [guards, setGuards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [journalLogs, setJournalLogs] = useState([]);
  const [journal, setJournal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showTables, setShowTables] = useState(false);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [mapType, setMapType] = useState("y"); // 🗺️ default: hybrid
  const [objectType, setObjectType] = useState("MAP");
  const mapWrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const baseUrl = import.meta.env.VITE_SERVER_PORT;
  const navigate = useNavigate();
  const { user } = useAuthStore((store) => store);

  const audioRef = useRef(null);

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

  const toggleFullscreen = async () => {
    if (!mapWrapperRef.current) return;

    if (!document.fullscreenElement) {
      await mapWrapperRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const fetchAllMaps = async () => {
    try {
      const res = await instance.get("/object");
      setMaps(res.data || []);
    } catch (err) {
      toast.error("Obyektlar ro‘yxatini yuklab bo‘lmadi 😞");
    }
  };

  const handleSelectMap = async (id) => {
    setLoading(true);
    try {
      const res = await instance.get(`/object/${id}`);
      setSelectedMap({
        ...res.data,
        imageUrl: `${baseUrl}${res.data.imageUrl}`,
      });
      await fetchInitialLogs(id);
    } catch (err) {
      toast.error("Obyekt ma'lumotlarini yuklab bo‘lmadi 😕");
    } finally {
      setLoading(false);
    }
  };

  // JournalLogs
  useEffect(() => {
    if (!journal) return; // modal yopiq bo‘lsa fetch bo‘lmaydi

    const fetchLogs = async () => {
      const res = await instance.get(
        `/admin/monitoringLogs?objectId=${selectedMap.id}&page=${page}&limit=30`,
      );
      const data = res?.data?.items || [];

      const formattedJournalLogs = data.map((log) => ({
        id: log.id,
        guard: log.user?.username || log.user?.login,
        checkpoint: log.checkpoint?.name || "-",
        createdAtRaw: new Date(log.createdAt),
        status: log.status,
      }));

      setJournalLogs(formattedJournalLogs);
      setTotal(res?.data?.total || 0); // pagination uchun total
    };

    fetchLogs();
  }, [journal, page]);

  // 🟢 Loglarni olish
  const fetchInitialLogs = async (objectId) => {
    try {
      const res = await instance.get(
        `/admin/logs?limit=50&objectId=${objectId}`,
      );
      const data = res?.data?.data || [];

      const formattedLogs = data.map((log) => ({
        id: log.id,
        guard: log.user?.username || log.user?.login,
        checkpoint: log.checkpoint?.name || "-",
        status: log.status,
        createdAt: new Date(log.createdAt).toLocaleTimeString(),
        createdAtRaw: new Date(log.createdAt),
        zoneId: log.checkpoint?.id,
        userId: log.userId,
      }));

      setLogs(formattedLogs);

      const guardsArr = [];
      data.forEach((log) => {
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
    } catch {
      toast.error("Loglarni olishda xatolik yuz berdi ⚠️");
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchAllMaps();
    };
    init();
  }, []);

  useEffect(() => {
    if (maps.length > 0 && !selectedMap) {
      handleSelectMap(maps[0].id);
    } else if (maps.length > 0 && selectedMap) {
      handleSelectMap(selectedMap?.id);
    }
  }, [maps]); // 🟢 faqat maps yangilansa, lekin fetch ichida emas

  useEffect(() => {
    audioRef.current = new Audio("/sound-example.wav");
    audioRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          })
          .catch(() => {});
      }
    };

    window.addEventListener("click", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  useEffect(() => {
    const handleLog = (log) => {
      if (log?.checkpoint?.objectId !== selectedMap?.id) return;

      const formattedLog = {
        id: log.id,
        guard: log.user?.username || log.user?.login,
        checkpoint: log.checkpoint?.name || "-",
        status: log.status,
        createdAt: new Date(log.createdAt).toLocaleTimeString(),
        createdAtRaw: new Date(log.createdAt),
        zoneId: log.checkpoint?.id,
        userId: log.userId,
        xPercent: log.checkpoint?.xPercent,
        yPercent: log.checkpoint?.yPercent,
      };

      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Audio blocked:", err);
      });

      new Noty({
        text: `<b>${formattedLog.guard}</b> - ${formattedLog.checkpoint}`,
        type:
          formattedLog.status === "ON_TIME"
            ? "success"
            : formattedLog.status === "LATE"
              ? "warning"
              : "error",
        layout: "topRight",
        timeout: 4000,
      }).show();

      // 🧩 logs update
      setLogs((prev) => [formattedLog, ...prev].slice(0, 50));

      // 🧩 guards update
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
    };

    socket.on("logs", handleLog);

    return () => {
      socket.off("logs", handleLog);
    };
  }, [selectedMap?.id]); // 🧩 faqat obyekt o‘zgarganda yangilanadi

  // 🛰️ GPS real-time yangilanishlar
  useEffect(() => {
    const handleGps = async (msg) => {
      // Masalan: msg = "gps:3"
      if (!msg.startsWith("gps:")) return;

      const userId = msg.split(":")[1];
      try {
        const res = await instance.get(`/admin/gps/${userId}?limit=20`);
        const points = res.data.map((p) => [p.location?.lat, p.location?.lng]);
        setGpsPoints(points);
      } catch (err) {
        toast.error("GPS ma’lumotlarini yuklab bo‘lmadi 📡");
      }
    };

    socket.on("gps", handleGps);

    return () => {
      socket.off("gps", handleGps);
    };
  }, []);

  const guardColumns = [
    { title: "Login", dataIndex: "login", key: "login" },
    { title: "Foydalanuvchi nomi", dataIndex: "username", key: "username" },
    {
      title: "Nazorat punkti",
      dataIndex: "checkpointName",
      key: "checkpointName",
    },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "ON_TIME"
          ? "Vaqtida kelgan"
          : status === "LATE"
            ? "Ozgina kechikib kelgan"
            : "Kech kelgan",
    },
  ];

  const journalLogColumns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Xodim",
      dataIndex: "guard",
      key: "guard",
    },
    { title: "Punkt nomi", dataIndex: "checkpoint", key: "checkpoint" },
    {
      title: "Kelgan sana",
      dataIndex: "createdAtRaw",
      render: (time) =>
        new Date(time).toLocaleTimeString("uz-UZ", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      key: "createdAt",
    },
    {
      title: "Xolati",
      dataIndex: "status",
      render: (status) =>
        status === "ON_TIME"
          ? "Vaqtida kelgan"
          : status === "LATE"
            ? "Ozgina kechikib kelgan"
            : "Kech kelgan",
      key: "status",
    },
  ];

  const logColumns = [
    { title: "Xodim", dataIndex: "guard", key: "guard" },
    { title: "Nazorat punkti", dataIndex: "checkpoint", key: "checkpoint" },
    {
      title: "Holati",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "ON_TIME"
          ? "Vaqtida kelgan"
          : status === "LATE"
            ? "Ozgina kechikib kelgan"
            : "Kech kelgan",
    },
    {
      title: "Vaqt",
      dataIndex: "createdAtRaw",
      render: (time) =>
        new Date(time).toLocaleTimeString("uz-UZ", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      key: "createdAt",
    },
  ];

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

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="mb-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 px-3 sm:px-5 py-2 bg-white border-b shadow-sm">
        {/* LEFT */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Title level={4} className="!mb-0 text-base sm:text-lg lg:text-xl">
            {selectedMap ? selectedMap.name : "Obyekt tanlanmagan"}
          </Title>

          <div className="flex flex-wrap gap-2">
            <Button
              color="purple"
              variant={objectType === "IMAGE" ? "outlined" : "solid"}
              onClick={() => setObjectType("IMAGE")}
            >
              Rasm
            </Button>

            <Button
              color="cyan"
              variant={objectType === "MAP" ? "outlined" : "solid"}
              onClick={() => setObjectType("MAP")}
            >
              Xarita
            </Button>

            <Select
              className="min-w-[140px] sm:min-w-[200px]"
              placeholder="Obyekt tanlang"
              value={selectedMap?.id}
              onChange={(id) => {
                const map = maps.find((m) => m.id === id);
                setSelectedMap(map);
                handleSelectMap(map.id);
              }}
              optionFilterProp="children"
            >
              {maps.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            type="primary"
            onClick={() => setJournal(true)}
          >
            Jurnallar
          </Button>

          <Button
            type="primary"
            onClick={() => setShowTables(true)}
          >
            Batafsil
          </Button>

          {user?.role === "ADMIN" && (
            <Button
              onClick={() => navigate("/admin")}
            >
              Admin panel
            </Button>
          )}
        </div>
      </div>

      {/* LOADING / EMPTY */}
      {loading && (
        <div className="h-[80vh] flex items-center justify-center">
          <Spin size="large" />
        </div>
      )}

      {!loading && selectedMap && (
        <>
          {selectedMap && (
            <div
              ref={mapWrapperRef}
              className={`relative ${
                isFullscreen ? "h-screen w-screen" : "h-94/100 w-99/100 m-auto"
              } border rounded-xl overflow-hidden`}
            >
              {objectType === "IMAGE" ? (
                <>
                  <img
                    src={selectedMap.imageUrl}
                    alt={selectedMap.name}
                    className="h-full w-full"
                  />

                  {selectedMap.checkpoints?.map((cp) => {
                    const latestLog = latestLogsByZone[cp.id];

                    return (
                      <CheckpointMarker
                        key={cp.id}
                        cp={cp}
                        latestLog={latestLog}
                        direction={cp?.infoStyle}
                        style={{
                          top: `${cp.position?.yPercent || 0}%`,
                          left: `${cp.position?.xPercent || 0}%`,
                        }}
                      />
                    );
                  })}
                </>
              ) : (
                objectType === "MAP" && (
                  <>
                    {/* 🧭 Xarita turi tanlash */}
                    <div
                      className="absolute top-3 left-15 z-[1000] bg-white rounded-md shadow-md p-2 flex items-center gap-2"
                      style={{ fontSize: "14px" }}
                    >
                      <span className="font-medium">Xarita turi:</span>
                      <Select
                        size="small"
                        value={mapType}
                        onChange={(val) => setMapType(val)}
                        style={{ width: 160 }}
                      >
                        <Option value="m">🛣️ Oddiy</Option>
                        <Option value="s">🛰️ Sun’iy yo‘ldosh</Option>
                        <Option value="y">🌍 Aralash</Option>
                        <Option value="p">⛰️ Relyef</Option>
                      </Select>
                    </div>
                    <div
                      className="absolute top-3 right-5 z-[1000] bg-white rounded-md shadow-md p-2 flex items-center gap-2"
                      style={{ fontSize: "14px" }}
                    >
                      <Button onClick={toggleFullscreen}>
                        {isFullscreen ? "Chiqish" : "To'liq ekran"}
                      </Button>
                    </div>

                    <MapContainer
                      center={selectedMap.position || [41, 61]}
                      zoom={selectedMap.zoom || 15}
                      scrollWheelZoom={true}
                      style={{ height: "100%", width: "100%" }}
                      attributionControl={false}
                    >
                      <TileLayer
                        url={`https://{s}.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
                        subdomains={["mt0", "mt1", "mt2", "mt3"]}
                        attribution="© Google Maps"
                      />

                      {selectedMap.checkpoints?.map((cp) => {
                        if (!cp.location?.lat || !cp.location?.lng) return null;

                        const latestLog = latestLogsByZone[cp.id];

                        return (
                          <React.Fragment key={cp.id}>
                            <Marker
                              key={cp.id}
                              position={[cp.location?.lat, cp.location?.lng]}
                              icon={invisibleIcon}
                            >
                              <CheckpointMarker
                                key={cp.id}
                                cp={cp}
                                latestLog={latestLog}
                                direction={cp?.infoStyle}
                                objectType="MAP"
                              />
                            </Marker>
                          </React.Fragment>
                        );
                      })}

                      {gpsPoints.length > 0 && (
                        <>
                          <Polyline
                            positions={gpsPoints}
                            color="blue"
                            weight={4}
                          />
                          {/* 🔹 So‘nggi nuqtada kichik yashil doira */}
                          <Marker
                            position={gpsPoints[gpsPoints.length - 1]}
                            icon={L.divIcon({
                              className: "",
                              html: `<div style="
                                width:10px;
                                height:10px;
                                background-color:green;
                                border:2px solid black;
                                border-radius:50%;
                              "></div>`,
                            })}
                          />
                        </>
                      )}
                    </MapContainer>
                  </>
                )
              )}
            </div>
          )}

          {/* Tafsilotlar Modal */}
          <Modal
            title="Batafsil ma'lumotlar"
            open={showTables}
            onCancel={() => setShowTables(false)}
            footer={null}
            width="90vw"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-xl p-4">
                <Title level={4}>So'nggi yozuvlar</Title>
                <Table
                  dataSource={logs.map((l, i) => ({ ...l, key: i }))}
                  columns={logColumns}
                  pagination={false}
                  scroll={{ y: 400 }}
                />
              </div>
              <div className="border rounded-xl p-4">
                <Title level={4}>Xodimlar ro'yxati</Title>
                <Table
                  dataSource={guards.map((g, i) => ({ ...g, key: i }))}
                  columns={guardColumns}
                  pagination={false}
                  scroll={{ y: 400 }}
                />
              </div>
            </div>
          </Modal>

          {/* Journal Modal */}
          <Modal
            open={journal}
            onCancel={() => setJournal(false)}
            footer={null}
            width="80vw"
            style={{ top: 20 }}
          >
            <Title level={4} style={{ textAlign: "center" }}>
              Xodimlar belgilash jurnali
            </Title>

            <Table
              size="small"
              dataSource={journalLogs.map((l, i) => ({
                ...l,
                key: i,
                id: (page - 1) * 30 + (i + 1), // sahifa bilan mos ID
              }))}
              columns={journalLogColumns}
              pagination={{
                current: page,
                pageSize: 30,
                total: total,
                showSizeChanger: false, // <-- shu yerni qo‘ysang 5/page yo‘q bo‘ladi
                onChange: (p) => setPage(p),
                showTotal: (total) => `Jami: ${total} ta`,
              }}
              scroll={{ y: 700 }}
            />
          </Modal>
        </>
      )}
    </div>
  );
}
