import { Modal, Select } from "antd";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate, formatTime } from "../../../../utils/dateFormat";

const { Option } = Select;

const locationIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapResize = ({ open }) => {
  const map = useMap();

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        map.invalidateSize();
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [open, map]);

  return null;
};

const LocationMapModal = ({ open, onClose, location, checkpoint, guard, createdAtRaw, status }) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState("y");

  const statusColors = {
    ON_TIME: "bg-emerald-500",
    LATE: "bg-yellow-400",
    MISSED: "bg-red-500",
  };

  const statusColor = statusColors[status] || "bg-gray-400";

  useEffect(() => {
    if (open && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current.invalidateSize();
        window.dispatchEvent(new Event('resize'));
        if (location && location.latitude && location.longitude) {
          mapRef.current.setView(
            [location.latitude, location.longitude],
            16,
            { animate: false }
          );
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, location]);

  if (!location || !location.latitude || !location.longitude) {
    return null;
  }

  const getStatusText = (status) => {
    if (status === "ON_TIME") return t("dashboardPage.onTimeStatus");
    if (status === "LATE") return t("dashboardPage.lateStatus");
    if (status === "VERY_LATE" || status === "MISSED") return t("dashboardPage.veryLateStatus");
    return status || "-";
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      title={<span className="text-white">{t("dashboardPage.checkinLocation")}</span>}
      className="dark-modal"
      styles={{
        content: { backgroundColor: "#111827", borderRadius: "1rem" },
        header: {
          backgroundColor: "#111827",
          borderBottom: "1px solid #374151",
        },
      }}
    >
      <div className="flex gap-4">
        {/* Checkpoint Info Panel */}
        <div className="w-64 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 flex flex-col gap-4">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">{t("dashboardPage.checkpointName")}</h3>
            <p className="text-white font-medium">{checkpoint || "-"}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm mb-1">{t("dashboardPage.username")}</h3>
            <p className="text-white font-medium">{guard || "-"}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm mb-1">{t("dashboardPage.arrivalDate")}</h3>
            <p className="text-white font-medium">
              {createdAtRaw ? `${formatDate(createdAtRaw)} ${formatTime(createdAtRaw)}` : "-"}
            </p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm mb-1">{t("dashboardPage.status")}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusColor}`} />
              <p className="text-white font-medium">{getStatusText(status)}</p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div style={{ height: "500px", flex: 1, position: "relative" }}>
          {/* Map type selector */}
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
              onChange={setMapType}
              className="select-green"
              style={{ width: 160 }}
            >
              <Option value="m">
                🛣️ {t("dashboardPage.mapNormal")}
              </Option>
              <Option value="s">
                🛰️ {t("dashboardPage.mapSatellite")}
              </Option>
              <Option value="y">
                🌍 {t("dashboardPage.mapHybrid")}
              </Option>
              <Option value="p">
                ⛰️ {t("dashboardPage.mapTerrain")}
              </Option>
            </Select>
          </div>
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={16}
            ref={mapRef}
            style={{ height: "100%", width: "100%" }}
            attributionControl={false}
          >
            <TileLayer
              url={`https://{s}.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
              subdomains={["mt0", "mt1", "mt2", "mt3"]}
              attribution="© Google Maps"
            />
            <Marker
              position={[location.latitude, location.longitude]}
              icon={locationIcon}
            />
            <MapResize open={open} />
          </MapContainer>
        </div>
      </div>
    </Modal>
  );
};

export default LocationMapModal;
