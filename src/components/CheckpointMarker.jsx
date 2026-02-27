import React, { useEffect, useState, useMemo } from "react";
import { Tooltip } from "react-leaflet";

export const CheckpointMarker = React.memo(function CheckpointMarker({
  cp,
  latestLog,
  objectType = "IMAGE",
  style,
}) {
  const [tick, setTick] = useState(0);

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

  return (
    <>
      {objectType === "MAP" ? (
        <Tooltip offset={[0, 5]} direction="top" permanent>
          <div className="text-sm text-center flex flex-col items-center">
            <div className="relative">
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-md px-2 py-1 whitespace-nowrap z-50">
                <p>{cp.name}</p>

                {latestLog && (
                  <>
                    <span>
                      {latestLog.createdAtRaw.toLocaleString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </span>

                    <b className="block">{latestLog.guard}</b>
                  </>
                )}

                {timeDiff && (
                  <div className="text-blue-600 font-semibold">{timeDiff}</div>
                )}
              </div>

              <div className={`w-4 h-4 rounded-full ${color}`} />
            </div>
          </div>
        </Tooltip>
      ) : (
        <div
          className="text-sm text-center absolute flex flex-col items-center"
          style={style}
        >
          <div className="relative">
            <div
              className={`w-4 h-4 rounded-full ${color} border-2 border-white`}
            />

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-md shadow px-2 py-1 whitespace-nowrap z-50">
              <p>{cp.name}</p>

              {latestLog && (
                <>
                  <span>
                    {latestLog.createdAtRaw.toLocaleString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
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
