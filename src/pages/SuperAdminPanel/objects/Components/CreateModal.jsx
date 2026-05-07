import {
  Modal,
  Input,
  Upload,
  Button,
  Select,
  InputNumber,
  Collapse,
} from "antd";
import { UploadOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";
import toast from "react-hot-toast";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { instance } from "../../../../config/axios-instance";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapControls from "./MapControl";

const { Panel } = Collapse;

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

/* ================= UNDO/REDO HOOK ================= */
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
  const { t } = useTranslation();

  const [objectName, setObjectName] = useState("");
  const [objectType, setObjectType] = useState("MAP");
  const [zoom, setZoom] = useState(15);
  const [mapType, setMapType] = useState("m");
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [cardNumberErrors, setCardNumberErrors] = useState({});
  const [errorIndexes, setErrorIndexes] = useState([]);
  const [activeKeys, setActiveKeys] = useState([]);

  const mapRef = useRef(null);
  const objectMarkerRef = useRef(null);

  const {
    state: objectPosition,
    set: setObjectPosition,
    undo: undoCenter,
    redo: redoCenter,
    canUndo: canUndoCenter,
    canRedo: canRedoCenter,
  } = useUndoRedo(null);

  const { state: checkpoints, set: setCheckpoints } = useUndoRedo([]);

  /* ===== FETCH ORGANIZATIONS ===== */
  useEffect(() => {
    instance
      .get("/superadmin/organizations")
      .then((res) => setOrganizations(res.data?.data || []))
      .catch(() => toast.error(t("superAdmin.organizations.loadError")));
  }, []);

  useEffect(() => {
    if (open && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current.invalidateSize();
        if (objectPosition) {
          mapRef.current.setView(
            [objectPosition.lat, objectPosition.lng],
            zoom,
            { animate: false },
          );
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

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
      setErrorIndexes([]);
      setActiveKeys([]);
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
      const newIndex = checkpoints.length;
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
      setActiveKeys((prev) => [...prev, String(newIndex)]);
      toast.success("🟢 " + t("superAdmin.objects.checkpointAdded"));
    },
    [image, checkpoints],
  );

  /* ================= MAP HANDLERS ================= */
  const MapResize = () => {
    const map = useMap();
    useEffect(() => {
      if (open) setTimeout(() => map.invalidateSize(), 100);
    }, [open]);
    return null;
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        if (!objectPosition) {
          setObjectPosition({ lat, lng });
        } else {
          const newIndex = checkpoints.length;
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
          setActiveKeys((prev) => [...prev, String(newIndex)]);
          toast.success("🟢 " + t("superAdmin.objects.checkpointAdded"));
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
              dragend(e) {
                const { lat, lng } = e.target.getLatLng();
                setObjectPosition({ lat, lng });
              },
            }}
          />
        )}
        {checkpoints.map((cp, i) =>
          cp.location ? (
            <Marker
              key={i}
              position={[cp.location.lat, cp.location.lng]}
              icon={checkpointIcon}
              draggable
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng();
                  handleChangeCheckpoint(i, "location", { lat, lng });
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent interactive>
                <span className="text-xs">{cp.name || `${i + 1}-punkt`}</span>
              </Tooltip>
            </Marker>
          ) : null,
        )}
      </>
    );
  };

  /* ================= CHECKPOINT HANDLERS ================= */
  const handleChangeCheckpoint = useCallback(
    (i, field, value) => {
      setCheckpoints((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], [field]: value };
        return next;
      });
      if (value) setErrorIndexes((prev) => prev.filter((idx) => idx !== i));

      // Card number o'zgarganda uning xatosini tozalash — yangi
      if (field === "cardNumber") {
        setCardNumberErrors((prev) => {
          const next = { ...prev };
          // Eski qiymatni topib o'chirish
          const oldValue = checkpoints[i]?.cardNumber;
          if (oldValue) delete next[oldValue];
          return next;
        });
      }
    },
    [checkpoints],
  );

  const handleDeleteCheckpoint = useCallback((i) => {
    setCheckpoints((prev) => prev.filter((_, idx) => idx !== i));
    setActiveKeys((prev) =>
      prev
        .filter((k) => k !== String(i))
        .map((k) => (Number(k) > i ? String(Number(k) - 1) : k)),
    );
    setErrorIndexes((prev) =>
      prev.filter((idx) => idx !== i).map((idx) => (idx > i ? idx - 1 : idx)),
    );
    toast.success("🗑️ " + t("superAdmin.objects.checkpointDeleted"));
  }, []);

  const handleAddCheckpoint = () => {
    const newIndex = checkpoints.length;
    setCheckpoints((prev) => [
      ...prev,
      {
        name: "",
        normalTime: 15,
        passTime: 2,
        cardNumber: "",
        position: { xPercent: 15, yPercent: 15 },
        location: { lat: 41.3, lng: 69.3 },
      },
    ]);
    setActiveKeys((prev) => [...prev, String(newIndex)]);
    toast.success("🟢 " + t("superAdmin.objects.checkpointAdded"));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    setErrorIndexes([]);
    setCardNumberErrors({});

    // Validatsiya
    const errors = [];
    checkpoints.forEach((cp, i) => {
      if (!cp.name?.trim() || !cp.cardNumber?.trim()) errors.push(i);
    });
    if (errors.length > 0) {
      setErrorIndexes(errors);
      setActiveKeys((prev) => [...new Set([...prev, ...errors.map(String)])]);
      toast.error(
        "❌ " +
          (t("superAdmin.objects.fillRequired") ||
            "Majburiy maydonlarni to'ldiring"),
      );
      return;
    }

    const cardNumbers = checkpoints.map((c) => c.cardNumber).filter(Boolean);
    const dup = cardNumbers.find((v, i) => cardNumbers.indexOf(v) !== i);
    if (dup) {
      toast.error(t("superAdmin.objects.duplicateCard") + `: ${dup}`);
      setCardNumberErrors({ [dup]: true });
      return;
    }

    try {
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
        toast.success(t("superAdmin.objects.createdSuccess"));
        fetchObjects();
        onClose();
      } catch (cpErr) {
        await instance.delete(`/superadmin/object/${objectId}`);

        // API dan kelgan card number xatosini accordion da ko'rsatish
        const errData = cpErr?.response?.data;
        if (errData?.cardNumber) {
          setCardNumberErrors({
            [errData.cardNumber]: errData.message || "Duplicate",
          });

          // Xato checkpointni topib ochish
          const errorIdx = checkpoints.findIndex(
            (cp) => cp.cardNumber === errData.cardNumber,
          );
          if (errorIdx !== -1) {
            setActiveKeys((prev) => [...new Set([...prev, String(errorIdx)])]);
            setErrorIndexes([errorIdx]);
          }
        }

        toast.error(t("superAdmin.objects.checkpointError"));
      }
    } catch (err) {
      const errData = err?.response?.data;

      if (errData?.cardNumber) {
        setCardNumberErrors({
          [errData.cardNumber]: errData.message || "Duplicate",
        });

        const errorIdx = checkpoints.findIndex(
          (cp) => cp.cardNumber === errData.cardNumber,
        );
        if (errorIdx !== -1) {
          setActiveKeys((prev) => [...new Set([...prev, String(errorIdx)])]);
          setErrorIndexes([errorIdx]);
        }
      }

      if (errData?.message?.includes("required"))
        toast.error(t("superAdmin.objects.selectOrg"));
      else toast.error(t("superAdmin.objects.saveError"));
    }
  };

  /* ================= RENDER ================= */
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={window.innerWidth * 0.99}
      title={t("superAdmin.objects.createTitle")}
      style={{ top: 10 }}
    >
      {/* Yuqori panel */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <Input
          placeholder={t("superAdmin.objects.objectName")}
          value={objectName}
          onChange={(e) => setObjectName(e.target.value)}
          style={{ maxWidth: 240 }}
        />

        <Select
          placeholder={t("superAdmin.objects.organization")}
          style={{ width: 220 }}
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

        <Button
          type={objectType === "MAP" ? "primary" : "default"}
          onClick={() => setObjectType("MAP")}
        >
          🗺️ {t("superAdmin.objects.map")}
        </Button>
        <Button
          type={objectType === "IMAGE" ? "primary" : "default"}
          onClick={() => setObjectType("IMAGE")}
        >
          🖼️ {t("superAdmin.objects.imageType")}
        </Button>

        {objectType === "IMAGE" && (
          <Upload
            accept="image/*"
            beforeUpload={() => false}
            onChange={handleImageUpload}
            maxCount={1}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>
              {t("superAdmin.objects.uploadImage")}
            </Button>
          </Upload>
        )}

        {objectType === "MAP" && (
          <>
            <Select
              value={mapType}
              onChange={setMapType}
              style={{ width: 180 }}
            >
              <Select.Option value="m">
                {t("superAdmin.objects.mapNormal")}
              </Select.Option>
              <Select.Option value="s">
                {t("superAdmin.objects.mapSatellite")}
              </Select.Option>
              <Select.Option value="y">
                {t("superAdmin.objects.mapHybrid")}
              </Select.Option>
              <Select.Option value="t">
                {t("superAdmin.objects.mapTerrain")}
              </Select.Option>
            </Select>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {t("superAdmin.objects.zoom")}:
            </span>
            <InputNumber
              min={0}
              max={18}
              value={zoom}
              onChange={setZoom}
              style={{ width: 70 }}
            />
          </>
        )}
      </div>

      {/* Split layout */}
      <div style={{ display: "flex", gap: 12, height: "82vh" }}>
        {/* LEFT — Rasm yoki Xarita */}
        <div
          style={{
            flex: "0 0 60%",
            overflow: "hidden",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          {objectType === "IMAGE" && (
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                cursor: image ? "crosshair" : "default",
              }}
              onClick={handleImageClick}
            >
              {image ? (
                <img
                  src={image}
                  alt="object"
                  style={{ width: "100%", height: "100%", objectFit: "fill" }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 40 }}>🖼️</span>
                  <span style={{ color: "#9ca3af" }}>
                    {t("superAdmin.objects.uploadImage")}
                  </span>
                </div>
              )}

              {image &&
                checkpoints
                  .filter((cp) => cp.position)
                  .map((cp, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: `${cp.position.yPercent}%`,
                        left: `${cp.position.xPercent}%`,
                        transform: "translate(-50%, -100%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          backgroundColor: "#22c55e",
                          borderRadius: "50%",
                          border: "2px solid white",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          backgroundColor: "white",
                          padding: "1px 5px",
                          borderRadius: 4,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          whiteSpace: "nowrap",
                          marginTop: 2,
                        }}
                      >
                        {cp.name || `${i + 1}-punkt`}
                      </span>
                    </div>
                  ))}
            </div>
          )}

          {objectType === "MAP" && (
            <MapContainer
              center={[
                objectPosition?.lat || 41.31,
                objectPosition?.lng || 69.28,
              ]}
              zoom={zoom || 15}
              ref={mapRef}
              style={{ height: "100%", width: "100%" }}
              attributionControl={false}
            >
              <TileLayer
                url={`https://mt1.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
                attribution="&copy; Google Maps"
              />
              <LocationMarker />
              <MapResize />
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
          )}
        </div>

        {/* RIGHT — Accordion checkpoints */}
        <div
          style={{
            flex: "0 0 40%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#eff6ff",
              borderBottom: "1px solid #dbeafe",
              fontWeight: 600,
              fontSize: 13,
              color: "#1e40af",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            📍 {t("superAdmin.objects.checkpointsTitle")}
            <span
              style={{
                backgroundColor: "#1d4ed8",
                color: "white",
                borderRadius: 10,
                padding: "1px 8px",
                fontSize: 11,
              }}
            >
              {checkpoints.length}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                fontWeight: 400,
                color: "#6b7280",
              }}
            >
              {objectType === "IMAGE"
                ? "🖱️ " +
                  (t("superAdmin.objects.clickToAdd") ||
                    "Rasmga bosib qo'shing")
                : "🗺️ " +
                  (t("superAdmin.objects.clickMapToAdd") ||
                    "Xaritaga bosib qo'shing")}
            </span>
            <Button
              size="small"
              type="dashed"
              onClick={handleAddCheckpoint}
              style={{ marginLeft: 6, fontSize: 11 }}
            >
              + {t("superAdmin.objects.add") || "Qo'shish"}
            </Button>
          </div>

          {/* Accordion */}
          <div style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
            {checkpoints.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  flexDirection: "column",
                  gap: 8,
                  color: "#9ca3af",
                }}
              >
                <span style={{ fontSize: 32 }}>📍</span>
                <span style={{ fontSize: 13 }}>
                  {t("superAdmin.objects.noCheckpoints") ||
                    "Hali checkpoint yo'q"}
                </span>
                <Button type="dashed" onClick={handleAddCheckpoint}>
                  + {t("superAdmin.objects.add") || "Checkpoint qo'shish"}
                </Button>
              </div>
            ) : (
              <Collapse
                activeKey={activeKeys}
                onChange={setActiveKeys}
                size="small"
                style={{
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {checkpoints.map((cp, i) => (
                  <Panel
                    key={String(i)}
                    style={{
                      border: `1px solid ${errorIndexes.includes(i) ? "#fca5a5" : "#e5e7eb"}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: errorIndexes.includes(i)
                        ? "#fff5f5"
                        : i % 2 === 0
                          ? "#ffffff"
                          : "#f8faff",
                      marginBottom: 6,
                    }}
                    header={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                        }}
                      >
                        <span
                          style={{
                            minWidth: 22,
                            height: 22,
                            backgroundColor: errorIndexes.includes(i)
                              ? "#ef4444"
                              : "#1d4ed8",
                            color: "white",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>

                        <span
                          style={{
                            fontWeight: 500,
                            color: "#1e40af",
                            fontSize: 13,
                            flex: 1,
                          }}
                        >
                          {cp.name || `${i + 1}-punkt`}
                        </span>

                        {errorIndexes.includes(i) && (
                          <span style={{ color: "#ef4444", fontSize: 11 }}>
                            ⚠️{" "}
                            {t("superAdmin.objects.fillRequired") ||
                              "To'ldiring"}
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: 11,
                            color: "#16a34a",
                            background: "#f0fdf4",
                            padding: "1px 6px",
                            borderRadius: 10,
                          }}
                        >
                          ⏱ {cp.normalTime ?? "—"} min
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            color: "#ea580c",
                            background: "#fff7ed",
                            padding: "1px 6px",
                            borderRadius: 10,
                          }}
                        >
                          🚶 {cp.passTime ?? "—"} min
                        </span>

                        <Popconfirm
                          title={t("superAdmin.objects.delete") + "?"}
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDeleteCheckpoint(i);
                          }}
                          okText={t("common.yes")}
                          cancelText={t("common.no")}
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            danger
                            size="small"
                            type="text"
                            onClick={(e) => e.stopPropagation()}
                            style={{ flexShrink: 0 }}
                          >
                            🗑️
                          </Button>
                        </Popconfirm>
                      </div>
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        padding: "4px 0",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 3,
                            }}
                          >
                            {t("superAdmin.objects.checkpointName")} *
                          </div>
                          <Input
                            value={cp.name}
                            onChange={(e) =>
                              handleChangeCheckpoint(i, "name", e.target.value)
                            }
                            placeholder={`${i + 1}-punkt`}
                            status={
                              errorIndexes.includes(i) && !cp.name?.trim()
                                ? "error"
                                : ""
                            }
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 3,
                            }}
                          >
                            {t("superAdmin.objects.cardNumber")} *
                          </div>
                          <Input
                            value={cp.cardNumber}
                            onChange={(e) =>
                              handleChangeCheckpoint(
                                i,
                                "cardNumber",
                                e.target.value,
                              )
                            }
                            status={
                              (errorIndexes.includes(i) &&
                                !cp.cardNumber?.trim()) ||
                              cardNumberErrors[cp.cardNumber]
                                ? "error"
                                : ""
                            }
                            placeholder="Card №"
                          />
                          {/* API xato xabari — yangi qo'shildi */}
                          {cardNumberErrors[cp.cardNumber] && (
                            <div
                              style={{
                                color: "#ef4444",
                                fontSize: 11,
                                marginTop: 3,
                              }}
                            >
                              ⚠️{" "}
                              {typeof cardNumberErrors[cp.cardNumber] ===
                              "string"
                                ? cardNumberErrors[cp.cardNumber]
                                : t("superAdmin.objects.duplicateCardExists") ||
                                  "Bu karta raqami band"}
                            </div>
                          )}
                        </div>{" "}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 3,
                            }}
                          >
                            {t("superAdmin.objects.normalTime")}
                          </div>
                          <InputNumber
                            min={1}
                            value={cp.normalTime}
                            onChange={(val) =>
                              handleChangeCheckpoint(i, "normalTime", val)
                            }
                            addonAfter="min"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 3,
                            }}
                          >
                            {t("superAdmin.objects.passTime")}
                          </div>
                          <InputNumber
                            min={1}
                            value={cp.passTime}
                            onChange={(val) =>
                              handleChangeCheckpoint(i, "passTime", val)
                            }
                            addonAfter="min"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 3,
                            }}
                          >
                            Style
                          </div>
                          <Select
                            value={cp.infoStyle || "TOP"}
                            onChange={(val) =>
                              handleChangeCheckpoint(i, "infoStyle", val)
                            }
                            style={{ width: "100%" }}
                          >
                            <Select.Option value="TOP">
                              {t("superAdmin.objects.styleTop")}
                            </Select.Option>
                            <Select.Option value="RIGHT">
                              {t("superAdmin.objects.styleRight")}
                            </Select.Option>
                            <Select.Option value="BOTTOM">
                              {t("superAdmin.objects.styleBottom")}
                            </Select.Option>
                            <Select.Option value="LEFT">
                              {t("superAdmin.objects.styleLeft")}
                            </Select.Option>
                            <Select.Option value="TOP_LEFT">
                              {t("superAdmin.objects.styleTopLeft")}
                            </Select.Option>
                            <Select.Option value="TOP_RIGHT">
                              {t("superAdmin.objects.styleTopRight")}
                            </Select.Option>
                            <Select.Option value="BOTTOM_LEFT">
                              {t("superAdmin.objects.styleBottomLeft")}
                            </Select.Option>
                            <Select.Option value="BOTTOM_RIGHT">
                              {t("superAdmin.objects.styleBottomRight")}
                            </Select.Option>
                          </Select>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 3,
                            }}
                          >
                            <EnvironmentOutlined /> X / Y %
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <InputNumber
                              min={0}
                              max={100}
                              value={cp?.position?.xPercent}
                              onChange={(val) =>
                                handleChangeCheckpoint(i, "position", {
                                  ...cp.position,
                                  xPercent: val,
                                })
                              }
                              addonAfter="X%"
                              style={{ width: "50%" }}
                            />
                            <InputNumber
                              min={0}
                              max={100}
                              value={cp?.position?.yPercent}
                              onChange={(val) =>
                                handleChangeCheckpoint(i, "position", {
                                  ...cp.position,
                                  yPercent: val,
                                })
                              }
                              addonAfter="Y%"
                              style={{ width: "50%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Panel>
                ))}
              </Collapse>
            )}
          </div>

          {/* Sticky footer */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            {errorIndexes.length > 0 && (
              <span
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  alignSelf: "center",
                  marginRight: "auto",
                }}
              >
                ⚠️ {errorIndexes.length} ta checkpoint to'ldirilmagan
              </span>
            )}
            <Button onClick={onClose}>{t("superAdmin.objects.cancel")}</Button>
            <Button type="primary" onClick={handleSubmit}>
              {t("superAdmin.objects.create")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateModal;
