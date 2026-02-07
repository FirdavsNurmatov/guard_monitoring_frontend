import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const objectIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const checkpointIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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
    if (modalOpen && mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
        if (objectPosition)
          mapRef.current.setView(
            [objectPosition.lat, objectPosition.lng],
            zoom,
          );
      }, 500);
    }
  }, [modalOpen, objectPosition, zoom]);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setZoom(zoom);
  }, [zoom]);

  const markerEventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker && onObjectMove) {
        const { lat, lng } = marker.getLatLng();
        onObjectMove({ lat, lng });
      }
    },
  };

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;

        if (!objectPosition && onObjectMove) {
          // Birinchi bosish object markaz bo‘lsin
          onObjectMove({ lat, lng });
          map.setView([lat, lng], map.getZoom());
        } else if (onAddCheckpoint) {
          // Keyingi bosishlar checkpoint qo‘shish uchun
          onAddCheckpoint(lat, lng);
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
        {checkpoints?.map(
          (cp, i) =>
            cp.location && (
              <Marker
                key={i}
                position={[cp.location.lat, cp.location.lng]}
                icon={checkpointIcon}
              >
                <Tooltip permanent direction="top">
                  {cp.name || `${i + 1}-punkt`}
                </Tooltip>
              </Marker>
            ),
        )}
      </>
    );
  };

  return (
    <MapContainer
      center={[objectPosition?.lat || 41.31, objectPosition?.lng || 69.28]}
      zoom={zoom || 15}
      whenCreated={(mapInstance) => {
        mapRef.current = mapInstance;
        mapInstance.on("zoomend", () => setZoom(mapInstance.getZoom()));
      }}
      style={{ height: "500px", width: "100%" }}
      attributionControl={false}
    >
      <TileLayer
        url={`https://mt1.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
        attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
      />
      <LocationMarker />
    </MapContainer>
  );
};

export default MapContainerWrapper;
