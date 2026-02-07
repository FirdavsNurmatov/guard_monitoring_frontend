import { Modal, Input, Upload, Button, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import { useState, useEffect, useRef, useCallback } from "react";
import { instance } from "../../../../config/axios-instance";
import CheckpointsForm from "./CheckpointsForm";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapControls from "./MapControl";

/* ================= ICONS ================= */

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

const useUndoRedo = (initialState) => {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialState);
  const [future, setFuture] = useState([]);

  const set = useCallback(
    (newState) => {
      setPast((p) => [...p, present]);
      setPresent(newState);
      setFuture([]);
    },
    [present],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [present, ...f]);
      setPresent(previous);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPast((p) => [...p, present]);
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  return {
    state: present,
    set,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};

/* ================= COMPONENT ================= */

const CreateModal = ({ open, onClose, fetchObjects }) => {
  /* ===== STATE ===== */
  const [objectName, setObjectName] = useState("");
  const [objectType, setObjectType] = useState("MAP");
  const [zoom, setZoom] = useState(15);
  const [mapType, setMapType] = useState("m");

  const {
    state: objectPosition,
    set: setObjectPosition,
    undo: undoCenter,
    redo: redoCenter,
    canUndo: canUndoCenter,
    canRedo: canRedoCenter,
  } = useUndoRedo(null);

  const {
    state: checkpoints,
    set: setCheckpoints,
    undo: undoCheckpoint,
    redo: redoCheckpoint,
    canUndo: canUndoCheckpoint,
    canRedo: canRedoCheckpoint,
  } = useUndoRedo([]);

  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);

  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);

  const [cardNumberErrors, setCardNumberErrors] = useState({});

  const mapRef = useRef(null);
  const objectMarkerRef = useRef(null);

  /* ===== FETCH ORGANIZATIONS ===== */
  useEffect(() => {
    instance
      .get("/superadmin/organizations")
      .then((res) => setOrganizations(res.data?.data || []))
      .catch(() => toast.error("Organizationlarni olishda xatolik"));
  }, []);

  useEffect(() => {
    if (open && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current.invalidateSize();
        if (objectPosition) {
          mapRef.current.setView(
            [objectPosition.lat, objectPosition.lng],
            zoom,
          );
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, objectPosition, zoom]);

  /* ===== RESET ON CLOSE ===== */
  useEffect(() => {
    if (!open) {
      setObjectName("");
      setObjectType("MAP");
      setObjectPosition(null);
      setCheckpoints([]);
      setFile(null);
      setImage(null);
      setCardNumberErrors({});
      setZoom(15);
    }
  }, [open]);

  /* ================= IMAGE HANDLERS ================= */

  const handleImageUpload = useCallback((info) => {
    if (!info.fileList || !info.fileList[0]) return;

    const f = info.fileList[0].originFileObj;
    if (!f) return;

    setFile(f);

    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleImageClick = useCallback(
    (e) => {
      if (!image) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setCheckpoints((prev) => [
        ...prev,
        {
          name: "",
          normalTime: 15,
          passTime: 2,
          cardNumber: "",
          position: { xPercent: +x.toFixed(2), yPercent: +y.toFixed(2) },
        },
      ]);
    },
    [image],
  );

  /* ================= MAP HANDLERS ================= */

  const handleAddCheckpoint = useCallback((lat, lng) => {
    setCheckpoints((prev) => [
      ...prev,
      {
        name: `Punkt ${prev.length + 1}`,
        normalTime: 15,
        passTime: 2,
        cardNumber: "",
        location: { lat, lng },
      },
    ]);
  }, []);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;

        if (!objectPosition) {
          setObjectPosition({ lat, lng });
        } else {
          handleAddCheckpoint(lat, lng);
        }
      },
    });

    return (
      <>
        {objectPosition && (
          <Marker
            position={[objectPosition.lat, objectPosition.lng]}
            draggable
            icon={objectIcon}
            ref={objectMarkerRef}
            eventHandlers={{
              dragend() {
                const { lat, lng } = objectMarkerRef.current.getLatLng();
                setObjectPosition({ lat, lng });
              },
            }}
          />
        )}

        {checkpoints.map(
          (cp, i) =>
            cp.location && (
              <Marker
                key={i}
                position={[cp.location.lat, cp.location.lng]}
                icon={checkpointIcon}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -10]}
                  permanent
                  interactive
                >
                  <div className="flex items-center gap-1 bg-white rounded shadow px-1">
                    <span className="text-xs">
                      {cp.name || `${i + 1}-punkt`}
                    </span>
                  </div>
                </Tooltip>
              </Marker>
            ),
        )}
      </>
    );
  };

  /* ================= CHECKPOINT HANDLERS ================= */

  const handleChangeCheckpoint = useCallback((i, field, value) => {
    setCheckpoints((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }, []);

  const handleDeleteCheckpoint = useCallback((i) => {
    setCheckpoints((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    try {
      const cardNumbers = checkpoints.map((c) => c.cardNumber).filter(Boolean);
      const dup = cardNumbers.find((v, i) => cardNumbers.indexOf(v) !== i);

      if (dup) {
        toast.error(`Duplicate card number: ${dup}`);
        setCardNumberErrors({ [dup]: true });
        return;
      }

      const fd = new FormData();
      if (file) fd.append("file", file);
      fd.append("name", objectName || `Object-${Date.now()}`);
      fd.append("zoom", zoom);
      if (organizationId) fd.append("organizationId", organizationId);
      if (objectPosition) fd.append("position", JSON.stringify(objectPosition));

      const { data } = await instance.post("/superadmin/object", fd);
      const objectId = data.id;

      try {
        await Promise.all(
          checkpoints.map((cp, idx) =>
            instance.post("/superadmin/checkpoint", {
              ...cp,
              objectId,
              name: cp.name?.trim() || `${idx + 1}-punkt`,
            }),
          ),
        );

        toast.success("Obyekt va checkpointlar yaratildi");
        fetchObjects();
        onClose();
      } catch (e) {
        await instance.delete(`/superadmin/object/${objectId}`);
        toast.error("Checkpoint xatolik – obyekt o‘chirildi");
      }
    } catch (err) {
      if (err?.response?.data?.message.includes("required"))
        toast.error("Organization tanlang");
      else toast.error("Saqlashda xatolik");
    }
  };

  /* ================= RENDER ================= */

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1400}
      title="Yangi obyekt yaratish"
      style={{ top: 10 }}
    >
      <Input
        placeholder="Obyekt nomi"
        value={objectName}
        onChange={(e) => setObjectName(e.target.value)}
      />

      <div className="flex gap-2 mt-3">
        <Button
          type={objectType === "MAP" ? "primary" : "default"}
          onClick={() => setObjectType("MAP")}
        >
          MAP
        </Button>
        <Button
          type={objectType === "IMAGE" ? "primary" : "default"}
          onClick={() => setObjectType("IMAGE")}
        >
          IMAGE
        </Button>
      </div>

      {/* Select */}
      <div className="mt-4 mb-4">
        <Select
          placeholder="Organization (optional)"
          style={{ width: 300 }}
          value={organizationId}
          onChange={setOrganizationId}
          allowClear
        >
          {organizations.map((o) => (
            <Select.Option key={o.id} value={o.id}>
              {o.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* MAP */}
      {objectType === "MAP" && (
        <div className="mt-4 mb-6">
          <div className="mb-2">
              <Select
              value={mapType}
              onChange={setMapType}
              style={{ width: 220 }}
            >
              <Select.Option value="m">🗺️ Map</Select.Option>
              <Select.Option value="s">🛰️ Satellite</Select.Option>
              <Select.Option value="y">🌍 Hybrid</Select.Option>
              <Select.Option value="t">⛰️ Terrain</Select.Option>
            </Select>
          </div>

          <MapContainer
            center={[
              objectPosition?.lat || 41.31,
              objectPosition?.lng || 69.28,
            ]}
            zoom={zoom || 15}
            whenCreated={(map) => {
              mapRef.current = map; // 🟢 bu yer juda muhim
              map.on("zoomend", () => setZoom(map.getZoom()));
            }}
            style={{ height: "500px", width: "100%" }}
            attributionControl={false}
          >
            <TileLayer
              url={`https://mt1.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
            />

            <LocationMarker />
            {objectPosition && (
              <MapControls
                onUndo={undoCenter}
                onRedo={redoCenter}
                onClear={() => setObjectPosition(null)}
                canUndo={canUndoCenter}
                canRedo={canRedoCenter}
              />
            )}
          </MapContainer>
          {/* <div className="flex gap-2 mt-2">
            <Button disabled={!canUndoCenter} onClick={undoCenter}>
              ⬅️ Undo center
            </Button>
            <Button disabled={!canRedoCenter} onClick={redoCenter}>
              ➡️ Redo center
            </Button>

            <Button disabled={!canUndoCheckpoint} onClick={undoCheckpoint}>
              ⬅️ Undo checkpoint
            </Button>
            <Button disabled={!canRedoCheckpoint} onClick={redoCheckpoint}>
              ➡️ Redo checkpoint
            </Button>
          </div> */}
        </div>
      )}

      {/* IMAGE */}
      {objectType === "IMAGE" && (
        <div className="mt-4 mb-6 flex flex-col gap-3">
          <Upload
            accept="image/*"
            beforeUpload={() => false}
            onChange={handleImageUpload}
            maxCount={1}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Rasm yuklash</Button>
          </Upload>

          {image && (
            <div
              className="relative mt-2 border rounded-xl shadow-md cursor-crosshair overflow-hidden"
              style={{ maxHeight: "80vh" }}
              onClick={handleImageClick}
            >
              <img
                src={image}
                alt="object"
                className="w-full object-contain rounded-xl"
              />

              {/* Checkpoints */}
              {checkpoints
                .filter((cp) => cp.position)
                .map((cp, index) => (
                  <div
                    key={index}
                    className="absolute flex flex-col items-center"
                    style={{
                      top: `${cp.position.yPercent}%`,
                      left: `${cp.position.xPercent}%`,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md" />
                    <span className="mt-1 text-xs bg-white px-1 rounded shadow">
                      {cp.name || `${index + 1}-punkt`}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <CheckpointsForm
        checkpoints={checkpoints}
        handleChange={handleChangeCheckpoint}
        handleDelete={handleDeleteCheckpoint}
        cardNumberErrors={cardNumberErrors}
      />

      <div className="flex justify-end gap-2 mt-4">
        <Button type="primary" onClick={handleSubmit}>
          Create
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
};

export default CreateModal;
