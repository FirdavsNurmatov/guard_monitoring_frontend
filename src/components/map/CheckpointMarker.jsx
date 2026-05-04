import React, { useEffect, useState, useMemo } from "react";
import { Timer, MapPin, Clock, User } from "lucide-react";
import { Tooltip } from "react-leaflet";

const STATUS_CONFIG = {
  ON_TIME: {
    dot: "#00e896",
    glow: "0 0 6px #00e896",
    accent: "#00e896",
    label: "VAQTIDA",
  },
  LATE: {
    dot: "#f5b800",
    glow: "0 0 6px #f5b800",
    accent: "#f5b800",
    label: "KECHIKDI",
  },
  MISSED: {
    dot: "#ff3d5a",
    glow: "0 0 6px #ff3d5a",
    accent: "#ff3d5a",
    label: "KELMADI",
  },
};

const DEFAULT_CONFIG = {
  dot: "#9ca3af",
  glow: "none",
  accent: "#9ca3af",
  label: "KUTILMOQDA",
};

const LAYOUTS = {
  TOP: {
    line: { w: 2, h: 18, b: 6, l: "50%", tx: "-50%" },
    popup: { b: 28, l: "50%", tx: "-50%" },
    grad: "to top",
  },
  BOTTOM: {
    line: { w: 2, h: 18, t: 6, l: "50%", tx: "-50%" },
    popup: { t: 28, l: "50%", tx: "-50%" },
    grad: "to bottom",
  },
  LEFT: {
    line: { w: 18, h: 2, r: 6, t: "50%", ty: "-50%" },
    popup: { r: 28, t: "50%", ty: "-50%" },
    grad: "to left",
  },
  RIGHT: {
    line: { w: 18, h: 2, l: 6, t: "50%", ty: "-50%" },
    popup: { l: 28, t: "50%", ty: "-50%" },
    grad: "to right",
  },
};

function useCountdown(log, cp) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => {
    if (!log) return null;
    const remain = Math.max(
      (cp.normalTime + cp.passTime) * 60 -
        Math.floor((Date.now() - log.createdAtRaw) / 1000),
      0,
    );
    if (remain <= 0) return null;
    const h = Math.floor(remain / 3600),
      m = Math.floor((remain % 3600) / 60),
      s = remain % 60;
    return h > 0
      ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [tick, log, cp.normalTime, cp.passTime]);
}

const formatTime = (ts) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

const injectTooltipReset = () => {
  if (document.getElementById("cp-tooltip-reset")) return;
  const tag = document.createElement("style");
  tag.id = "cp-tooltip-reset";
  tag.textContent = `.leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;border-radius:0!important}.leaflet-tooltip::before{display:none!important}`;
  document.head.appendChild(tag);
};

const PopupCard = React.memo(({ cp, latestLog, cfg, countdown }) => (
  <div
    style={{
      background: "#111827",
      border: "1px solid #374151",
      borderLeft: `3px solid ${cfg.accent}`,
      borderRadius: 10,
      padding: "4px 6px",
      minWidth: 180,
      whiteSpace: "nowrap",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        marginBottom: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <MapPin size={16} color={cfg.accent} strokeWidth={2.5} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#fff",
          }}
        >
          {cp.name}
        </span>
      </div>
      <span
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          letterSpacing: "0.05em",
          fontWeight: 700,
          padding: "1px 4px",
          borderRadius: 6,
          color: cfg.accent,
          background: "rgba(31,41,55,0.8)",
          border: `1px solid ${cfg.accent}`,
          lineHeight: 1.3,
        }}
      >
        {cfg.label}
      </span>
    </div>
    <div style={{ height: 1, background: "#374151", marginBottom: 3 }} />
    {latestLog ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Clock size={14} color="#9ca3af" strokeWidth={2} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 14,
                color: "#9ca3af",
                fontWeight: 500,
              }}
            >
              {formatTime(latestLog.createdAtRaw)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <User size={14} color="#10b981" strokeWidth={2} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              {latestLog.guard}
            </span>
          </div>
        </div>
        {countdown && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              fontFamily: "monospace",
              fontSize: 15,
              fontWeight: 700,
              color: "#4fc3f7",
              letterSpacing: "0.05em",
              background: "rgba(79,195,247,0.15)",
              border: "1px solid rgba(79,195,247,0.3)",
              borderRadius: 6,
              padding: "1px 3px",
            }}
          >
            <Timer size={16} strokeWidth={2.2} />
            {countdown}
          </div>
        )}
      </div>
    ) : null}
  </div>
));

// ---------------------------------------------------------------------------
// Main marker
// ---------------------------------------------------------------------------

export const CheckpointMarker = React.memo(
  ({ cp, latestLog, direction = "TOP", objectType = "IMAGE", style }) => {
    useEffect(() => injectTooltipReset(), []);
    const countdown = useCountdown(latestLog, cp);
    const cfg = latestLog
      ? (STATUS_CONFIG[latestLog.status] ?? DEFAULT_CONFIG)
      : DEFAULT_CONFIG;
    const ly = LAYOUTS[direction];

    const lineStyle = {
      position: "absolute",
      background: `linear-gradient(${ly.grad}, transparent, ${cfg.dot})`,
      borderRadius: 2,
      transform: `translateX(${ly.line.tx || 0}) translateY(${ly.line.ty || 0})`,
    };
    if (ly.line.w) lineStyle.width = ly.line.w;
    if (ly.line.h) lineStyle.height = ly.line.h;
    if (ly.line.t !== undefined) lineStyle.top = ly.line.t;
    if (ly.line.b !== undefined) lineStyle.bottom = ly.line.b;
    if (ly.line.l) lineStyle.left = ly.line.l;
    if (ly.line.r !== undefined) lineStyle.right = ly.line.r;

    const popupStyle = {
      position: "absolute",
      zIndex: 50,
      transform: `translateX(${ly.popup.tx || 0}) translateY(${ly.popup.ty || 0})`,
    };
    if (ly.popup.t !== undefined) popupStyle.top = ly.popup.t;
    if (ly.popup.b !== undefined) popupStyle.bottom = ly.popup.b;
    if (ly.popup.l) popupStyle.left = ly.popup.l;
    if (ly.popup.r !== undefined) popupStyle.right = ly.popup.r;

    const Inner = (
      <div style={{ position: "relative", width: 12, height: 12 }}>
        {latestLog && (
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: `1px solid ${cfg.dot}`,
              opacity: 0.3,
              animation: "cp-ping 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          />
        )}
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: cfg.dot,
            boxShadow: cfg.glow,
            border: "1.5px solid #374151",
            position: "relative",
            zIndex: 1,
          }}
        />
        <div style={lineStyle} />
        <div style={popupStyle}>
          <PopupCard
            cp={cp}
            latestLog={latestLog}
            cfg={cfg}
            countdown={countdown}
          />
        </div>
      </div>
    );

    return objectType === "MAP" ? (
      <Tooltip direction={direction.toLowerCase()} permanent>
        {Inner}
      </Tooltip>
    ) : (
      <div style={{ position: "absolute", ...style }}>{Inner}</div>
    );
  },
);
