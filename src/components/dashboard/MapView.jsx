import { CheckpointMarker } from "../map/CheckpointMarker";
import { Button, Select } from "antd";
import { Toaster } from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { forwardRef, useCallback } from "react";

const { Option } = Select;

const invisibleIcon = L.divIcon({
  className: "",
  html: `<div style="width:0;height:0;"></div>`,
  iconSize: [0, 0],
});

const MapView = forwardRef(
  (
    {
      selectedMap,
      objectType,
      mapType,
      setMapType,
      latestLogsByZone,
      gpsPoints,
      isFullscreen,
      toggleFullscreen,
      t,
    },
    ref,
  ) => {
    const handleMapTypeChange = useCallback(
      (val) => {
        setMapType(val);
      },
      [setMapType],
    );

    return (
      <div
        ref={ref}
        className={`relative ${
          isFullscreen ? "h-screen w-screen" : "h-94/100 w-99/100 m-auto"
        } border border-gray-700/50 rounded-xl overflow-hidden shadow-lg shadow-black/20`}
      >
        <Toaster position="top-right" reverseOrder={false} />
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
                    transform: "translate(-50%, -100%)",
                    flexDirection: "column",
                    pointerEvents: "none",
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
                className="absolute top-3 left-15 z-[1000] bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-2 flex items-center gap-2"
                style={{ fontSize: "14px" }}
              >
                <span className="font-medium text-gray-200">
                  {t("dashboardPage.mapType")}:
                </span>
                <Select
                  size="small"
                  value={mapType}
                  onChange={handleMapTypeChange}
                  className="select-green"
                  style={{ width: 160 }}
                >
                  <Option value="m">🛣️ {t("dashboardPage.mapNormal")}</Option>
                  <Option value="s">
                    🛰️ {t("dashboardPage.mapSatellite")}
                  </Option>
                  <Option value="y">🌍 {t("dashboardPage.mapHybrid")}</Option>
                  <Option value="p">⛰️ {t("dashboardPage.mapTerrain")}</Option>
                </Select>
              </div>
              <div
                className="absolute top-3 right-5 z-[1000] bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-2 flex items-center gap-2"
                style={{ fontSize: "14px" }}
              >
                <Button
                  onClick={toggleFullscreen}
                  className="btn-primary-green"
                >
                  {isFullscreen
                    ? t("dashboardPage.exitFullscreen")
                    : t("dashboardPage.fullscreen")}
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
                    <Marker
                      key={cp.id}
                      position={[cp.location?.lat, cp.location?.lng]}
                      icon={invisibleIcon}
                    >
                      <CheckpointMarker
                        cp={cp}
                        latestLog={latestLog}
                        direction={cp?.infoStyle}
                        objectType="MAP"
                      />
                    </Marker>
                  );
                })}

                {gpsPoints.length > 0 && (
                  <>
                    <Polyline positions={gpsPoints} color="blue" weight={4} />
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
    );
  },
);

MapView.displayName = "MapView";

export default MapView;
