import React, { useEffect, useState, useMemo } from "react";
import { Tooltip } from "react-leaflet";
import { useTranslation } from "react-i18next";
import { formatTime } from "../utils/dateFormat";

export const CheckpointMarker = React.memo(function CheckpointMarker({
  cp,
  latestLog,
  direction = "TOP",
  objectType = "IMAGE",
  style,
}) {
  const { i18n } = useTranslation();
  const [tick, setTick] = useState(0);

  // Get current locale based on language
  const currentLocale = i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 Countdown hisoblash
  const timeDiff = useMemo(() => {
    if (!latestLog) return null;

    const now = Date.now();
    const diffSec = Math.floor((now - latestLog.createdAtRaw) / 1000);

    const totalTime = (cp.normalTime + cp.passTime) * 60;
    const remain = Math.max(totalTime - diffSec, 0);

    if (remain <= 0) return null;

    const hours = Math.floor(remain / 3600);
    const minutes = Math.floor((remain % 3600) / 60);
    const seconds = remain % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  }, [tick, latestLog, cp.normalTime, cp.passTime]);

  const statusColors = {
    ON_TIME: "bg-green-500",
    LATE: "bg-yellow-400",
    MISSED: "bg-red-500",
  };

  const color = latestLog ? statusColors[latestLog.status] : "bg-gray-400";

  const positionClass =
    direction === "TOP"
      ? "bottom-5 left-1/2 -translate-x-1/2"
      : direction === "BOTTOM"
        ? "top-5 left-1/2 -translate-x-1/2"
        : direction === "LEFT"
          ? "top-1/2 right-5 -translate-y-1/2"
          : direction === "RIGHT"
            ? "top-1/2 left-5 -translate-y-1/2"
            : "bottom-5 left-1/2 -translate-x-1/2";

  return (
    <>
      {objectType === "MAP" ? (
        <Tooltip direction={direction.toLowerCase()} permanent>
          <div className="text-sm text-center flex flex-col items-center">
            <div className="relative">
              <div
                className={`absolute bg-white rounded-md px-2 py-1 whitespace-nowrap z-50
                ${direction === "TOP" ? "bottom-4 left-1/2 -translate-x-1/2" : ""}
                ${direction === "BOTTOM" ? "top-4 left-1/2 -translate-x-1/2" : ""}
                ${direction === "LEFT" ? "top-1/2 right-4 -translate-y-1/2" : ""}
                ${direction === "RIGHT" ? "top-1/2 left-4 -translate-y-1/2" : ""}
              `}
              >
                <p>{cp.name}</p>
                {latestLog && (
                  <>
                    <span>
                      {formatTime(latestLog.createdAtRaw)}
                    </span>

                    <b className="block">{latestLog.guard}</b>
                  </>
                )}
                {timeDiff && (
                  <div className="text-blue-600 font-semibold">{timeDiff}</div>
                )}
              </div>

              <div className={`w-3 h-3 rounded-full ${color}`} />
            </div>
          </div>
        </Tooltip>
      ) : (
        <div
          className="text-sm text-center absolute"
          style={style}
        >
          <div className="relative">
            <div
              className={`w-4 h-4 rounded-full ${color} border-2 border-white`}
            />

            <div
              className={`absolute ${positionClass} bg-white rounded-md shadow px-1 py-1 whitespace-nowrap z-50`}
            >
              <p>{cp.name}</p>
              {latestLog && (
                <>
                  <span>
                    {formatTime(latestLog.createdAtRaw)}
                  </span>

                  <b className="block">{latestLog.guard}</b>
                </>
              )}
              {timeDiff && (
                <div className="text-blue-600 font-semibold">{timeDiff}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
