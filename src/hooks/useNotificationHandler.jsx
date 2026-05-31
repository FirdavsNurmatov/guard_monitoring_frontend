import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export const useNotificationHandler = (socket, selectedMap, i18n, t, onLogReceived) => {
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/sound-example.wav");
    audioRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (!socket) return;

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
        // console.log("Audio blocked:", err);
      });

      const statusText =
        formattedLog.status === "ON_TIME"
          ? t("dashboardPage.onTimeStatus")
          : formattedLog.status === "LATE"
            ? t("dashboardPage.lateStatus")
            : t("dashboardPage.veryLateStatus");

      const icon =
        formattedLog.status === "ON_TIME"
          ? <CheckCircle className="w-5 h-5 text-white" />
          : formattedLog.status === "LATE"
            ? <AlertTriangle className="w-5 h-5 text-white" />
            : <XCircle className="w-5 h-5 text-white" />;

      toast(
        ({ id }) => (
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-bold text-base">{formattedLog.guard}</span>
                <span className="text-sm opacity-90">{formattedLog.checkpoint}</span>
                <span className="text-sm mt-1 opacity-75">{statusText}</span>
              </div>
              <button
                onClick={() => toast.dismiss(id)}
                className="ml-2 text-white/70 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000,
          position: "top-right",
          icon,
          style: {
            zIndex: 99999,
            background:
              formattedLog.status === "ON_TIME"
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : formattedLog.status === "LATE"
                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "white",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            minWidth: "200px",
          },
          iconTheme: {
            primary: "white",
            secondary: "rgba(255, 255, 255, 0.3)",
          },
        },
      );

      // Callback to update parent state
      if (onLogReceived) {
        onLogReceived(formattedLog, log);
      }
    };

    socket.on("connect", () => {
      console.log("✅ Connected", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
    });

    socket.on("logs", handleLog);

    return () => {
      socket.off("logs", handleLog);
    };
  }, [selectedMap?.id, socket, i18n.language, t, onLogReceived]);

  return { audioRef };
};
