export function CheckpointMarker({ cp, latestLog, timeDiff, style = {} }) {
  const statusColors = {
    ON_TIME: "bg-green-500",
    LATE: "bg-yellow-400",
    MISSED: "bg-red-500",
  };

  const color = latestLog ? statusColors[latestLog.status] : "bg-gray-400";

  return (
    <div
      className="text-sm text-center absolute flex flex-col items-center"
      style={style}
    >
      <div className="relative group">
        {/* 🔴 marker doira */}
        <div
          className={`w-4 h-4 rounded-full ${color} border-2 border-white shadow`}
        />

        {/* 🟦 tooltip */}
        <div
          className="
            absolute bottom-5 left-1/2 -translate-x-1/2
            bg-white rounded-md shadow px-2 py-1
            pointer-events-none transition
            whitespace-nowrap z-50
          "
        >
          <p>{cp.name}</p>
          <span className="font-sans">
            {latestLog && (
              <>
                {latestLog.createdAtRaw.toLocaleString("uz-UZ", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </>
            )}
            {latestLog && (
              <b className="font-bold">
                <br />
                {latestLog.guard}
              </b>
            )}
          </span>
          {timeDiff && (
            <div className="text-blue-600 font-semibold">{timeDiff}</div>
          )}
        </div>
      </div>
    </div>
  );
}
