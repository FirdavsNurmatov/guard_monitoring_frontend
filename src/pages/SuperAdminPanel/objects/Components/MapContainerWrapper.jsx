import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Object (qizil) marker ---
const objectIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- Checkpoint DivIcon factory ---
// direction: "top" | "bottom" | "left" | "right"
const makeCheckpointIcon = (name, index) => {
  const html = `
    <div style="position:relative;width:120px;height:70px;pointer-events:none;">
      <!-- Label card (yuqorida) -->
      <div style="
        position:absolute;
        top:25%;left:50%;
        transform:translateX(-50%);
        background:#111827;
        border:1px solid #374151;
        border-left:3px solid #00e896;
        border-radius:8px;
        padding:3px 8px;
        white-space:nowrap;
        font-size:12px;
        font-weight:700;
        color:#fff;
        font-family:sans-serif;
        letter-spacing:0.03em;
      ">${name || `${index + 1}-punkt`}</div>

      <!-- Line -->
      <div style="
        position:absolute;
        bottom:8px;left:50%;
        transform:translateX(-50%);
        width:8px;height:20px;
        background:linear-gradient(to bottom,#00e896,transparent);
      "></div>

      <!-- Dot -->
      <div style="
        position:absolute;
        bottom:0;left:50%;
        transform:translateX(-50%);
        width:16px;height:16px;
        border-radius:50%;
        background:#00e896;
        box-shadow:0 0 6px #00e896;
        border:2px solid #1a2332;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [120, 70],
    iconAnchor: [60, 70], // dot markaziga
  });
};

// --- CSS inject (ping animatsiyasi) ---
const injectStyles = () => {
  if (document.getElementById("map-cp-styles")) return;
  const tag = document.createElement("style");
  tag.id = "map-cp-styles";
  tag.textContent = `
    .leaflet-tooltip {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    .leaflet-tooltip::before { display: none !important; }
  `;
  document.head.appendChild(tag);
};

// --- LocationMarker (tashqarida) ---
const LocationMarker = ({
  objectPosition,
  checkpoints,
  onObjectMove,
  onAddCheckpoint,
  markerRef,
  markerEventHandlers,
  checkpointHandlers,
}) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (!objectPosition) {
        onObjectMove?.({ lat, lng });
      } else {
        onAddCheckpoint?.(lat, lng);
      }
    },
  });

  return (
    <>
      {objectPosition && (
        <Marker
          position={[objectPosition.lat, objectPosition.lng]}
          draggable={!!onObjectMove}
          eventHandlers={markerEventHandlers}
          ref={markerRef}
          icon={objectIcon}
        />
      )}
      {checkpoints?.map((cp, i) =>
        cp.location ? (
          <Marker
            key={cp.id ?? i}
            position={[cp.location.lat, cp.location.lng]}
            icon={makeCheckpointIcon(cp.name, i)}
            draggable={!!onAddCheckpoint}
            eventHandlers={checkpointHandlers?.[i]}
          />
        ) : null,
      )}
    </>
  );
};

// --- Asosiy komponent ---
const MapContainerWrapper = ({
  objectPosition,
  zoom,
  setZoom,
  checkpoints,
  onObjectMove,
  onAddCheckpoint,
  modalOpen,
  mapType = "y",
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (!modalOpen || !mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current.invalidateSize();
      if (objectPosition) {
        mapRef.current.setView([objectPosition.lat, objectPosition.lng], zoom);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [modalOpen, objectPosition, zoom]);

  useEffect(() => {
    mapRef.current?.setZoom(zoom);
  }, [zoom]);

  const markerEventHandlers = useMemo(
    () => ({
      dragend(e) {
        const { lat, lng } = e.target.getLatLng();
        onObjectMove?.({ lat, lng });
      },
    }),
    [onObjectMove],
  );

  const checkpointHandlers = useMemo(
    () =>
      checkpoints?.map((_, i) => ({
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          onAddCheckpoint?.(lat, lng, i);
        },
      })) ?? [],
    [checkpoints, onAddCheckpoint],
  );

  return (
    <MapContainer
      ref={mapRef}
      center={[objectPosition?.lat ?? 41.31, objectPosition?.lng ?? 69.28]}
      zoom={zoom ?? 15}
      zoomControl={true}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
      whenReady={() => {
        mapRef.current?.on("zoomend", () => setZoom(mapRef.current.getZoom()));
      }}
    >
      <TileLayer
        url={`https://mt1.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
        attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
      />
      <LocationMarker
        objectPosition={objectPosition}
        checkpoints={checkpoints}
        onObjectMove={onObjectMove}
        onAddCheckpoint={onAddCheckpoint}
        markerRef={markerRef}
        markerEventHandlers={markerEventHandlers}
        checkpointHandlers={checkpointHandlers}
      />
    </MapContainer>
  );
};

export default MapContainerWrapper;
