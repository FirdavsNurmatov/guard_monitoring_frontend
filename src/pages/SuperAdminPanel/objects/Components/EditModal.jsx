import { Modal, Input, Button, InputNumber, Select, Collapse } from "antd";
import toast from "react-hot-toast";
import MapContainerWrapper from "./MapContainerWrapper";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { instance } from "../../../../config/axios-instance";
import { Upload } from "antd";
import { UploadOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";

const { Option } = Select;
const { Panel } = Collapse;

const EditModal = ({ open, onClose, objectData, fetchObjects }) => {
  const { t } = useTranslation();
  const [fullObject, setFullObject] = useState(null);
  const [objectName, setObjectName] = useState("");
  const [objectType, setObjectType] = useState("IMAGE");
  const [zoom, setZoom] = useState(15);
  const [mapType, setMapType] = useState("y");
  const [checkpoints, setCheckpoints] = useState([]);
  const [objectPosition, setObjectPosition] = useState(null);
  const [apiError, setApiError] = useState("");
  const [cardNumberErrors, setCardNumberErrors] = useState({});
  const [errorIndexes, setErrorIndexes] = useState([]);
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeKeys, setActiveKeys] = useState([]);

  useEffect(() => {
    if (!objectData?.id) return;
    const fetchFullObject = async () => {
      try {
        const { data } = await instance.get(
          `/superadmin/object/${objectData.id}`,
        );
        setFullObject(data);
      } catch (err) {}
    };
    fetchFullObject();
  }, [objectData?.id]);

  useEffect(() => {
    if (!fullObject) return;
    setObjectName(fullObject.name || "");
    setObjectType(fullObject.type || "IMAGE");
    setZoom(fullObject.zoom || 15);
    setObjectPosition(fullObject.position || null);
    setCheckpoints(fullObject.checkpoints || []);
    setActiveKeys([]);
    setErrorIndexes([]);
    setFile(null);
    setPreviewImage(null);
    if (fullObject.imageUrl) {
      setPreviewImage(import.meta.env.VITE_SERVER_PORT + fullObject.imageUrl);
    }
  }, [fullObject]);

  const handleImageUpload = (info) => {
    if (!info.fileList?.length) return;
    const f = info.fileList[0].originFileObj;
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleRemoveImage = async () => {
    try {
      await instance.delete(`/superadmin/object/${fullObject.id}/image`);
      setPreviewImage(null);
      setFile(null);
      toast.success(t("superAdmin.objects.imageRemoved"));
    } catch {
      toast.error(t("superAdmin.objects.removeImageError"));
    }
  };

  const handleChangeCheckpoint = (index, field, value) => {
    setCheckpoints((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // Yozila boshlaganda xatoni olib tashlash
    if (value) {
      setErrorIndexes((prev) => prev.filter((idx) => idx !== index));
    }
  };

  const handleImageClick = (e) => {
    if (!previewImage) return;
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
  };

  // FIX 1: index bo'yicha o'chirish + activeKeys qayta hisoblash
  const handleDeleteCheckpoint = async (id, index) => {
    try {
      if (id) await instance.delete(`/superadmin/checkpoint/${id}`);
      setCheckpoints((prev) => prev.filter((_, idx) => idx !== index));
      setActiveKeys((prev) =>
        prev
          .filter((k) => k !== String(index))
          .map((k) => (Number(k) > index ? String(Number(k) - 1) : k)),
      );
      setErrorIndexes((prev) =>
        prev
          .filter((idx) => idx !== index)
          .map((idx) => (idx > index ? idx - 1 : idx)),
      );
      toast.success("🗑️ " + t("superAdmin.objects.checkpointDeleted"));
    } catch {
      toast.error("❌ " + t("superAdmin.objects.deleteCheckpointError"));
    }
  };

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

  // FIX 3: Validatsiya + xato checkpointlarni highlight
  const handleUpdate = async () => {
    setCardNumberErrors({});
    setApiError("");
    setErrorIndexes([]);

    // Majburiy maydonlar tekshiruvi
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

    // Duplicate card number tekshirish
    const cardNumbers = checkpoints.map((cp) => cp.cardNumber).filter(Boolean);
    const duplicates = cardNumbers.filter(
      (cn, idx) => cardNumbers.indexOf(cn) !== idx,
    );
    if (duplicates.length > 0) {
      toast.error(
        `❌ ` + t("superAdmin.objects.duplicateCard") + `: ${duplicates[0]}`,
      );
      setCardNumberErrors({ [duplicates[0]]: "Duplicate" });
      return;
    }

    try {
      const updatedCheckpoints = checkpoints.map((cp, i) => ({
        ...cp,
        name: cp.name?.trim() || `${i + 1}-punkt`,
        position: cp?.position || { xPercent: 15, yPercent: 15 },
        location: cp?.location || { lat: 41.3, lng: 69.3 },
      }));

      await instance.patch(`/superadmin/object/${fullObject.id}`, {
        name: objectName,
        position: objectPosition,
        zoom,
      });

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        await instance.post(`/superadmin/object/${fullObject.id}/image`, fd);
      }

      for (const cp of updatedCheckpoints) {
        if (cp.id) {
          const { id, createdAt, updatedAt, ...data } = cp;
          await instance.patch(`/superadmin/checkpoint/${cp.id}`, {
            ...data,
            objectId: fullObject.id,
          });
        } else {
          await instance.post("/superadmin/checkpoint", {
            ...cp,
            objectId: fullObject.id,
          });
        }
      }

      toast.success("✅ " + t("superAdmin.objects.updatedSuccess"));
      fetchObjects?.();
      onClose();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.cardNumber) {
        setCardNumberErrors({ [data?.cardNumber]: "Duplicate" });
        setApiError(
          `${data.cardNumber} - ` + t("superAdmin.objects.duplicateCardExists"),
        );
      } else if (data?.message) {
        setApiError(data.message);
      } else {
        setApiError(t("superAdmin.objects.unknownError"));
      }
      toast.error("❌ " + t("superAdmin.objects.updateError"));
    }
  };

  return (
    <Modal
      title={t("superAdmin.objects.editTitle") + `: ${objectName}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={window.innerWidth * 0.99}
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
        <Button
          type={objectType === "IMAGE" ? "primary" : "default"}
          onClick={() => setObjectType("IMAGE")}
        >
          🖼️ {t("superAdmin.objects.image") || "Rasm"}
        </Button>
        <Button
          type={objectType === "MAP" ? "primary" : "default"}
          onClick={() => setObjectType("MAP")}
        >
          🗺️ {t("superAdmin.objects.map") || "Xarita"}
        </Button>

        {objectType === "IMAGE" && (
          <>
            <Upload
              accept="image/*"
              beforeUpload={() => false}
              onChange={handleImageUpload}
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                {previewImage
                  ? t("superAdmin.objects.replaceImage")
                  : t("superAdmin.objects.uploadImage")}
              </Button>
            </Upload>
            {previewImage && (
              <Popconfirm
                title={t("superAdmin.objects.confirmRemoveImage")}
                description={t("superAdmin.objects.removeImageWarning")}
                onConfirm={handleRemoveImage}
                okText={t("common.yes")}
                cancelText={t("common.no")}
                okButtonProps={{ danger: true }}
              >
                <Button danger>🗑️ {t("superAdmin.objects.removeImage")}</Button>
              </Popconfirm>
            )}
          </>
        )}

        {objectType === "MAP" && (
          <>
            <span style={{ color: "#6b7280", fontSize: 13 }}>
              {t("superAdmin.objects.zoom")}:
            </span>
            <InputNumber
              min={0}
              max={18}
              value={zoom}
              onChange={setZoom}
              style={{ width: 70 }}
            />
            <Select
              value={mapType}
              onChange={setMapType}
              style={{ width: 150 }}
            >
              <Option value="m">{t("superAdmin.objects.mapNormal")}</Option>
              <Option value="s">{t("superAdmin.objects.mapSatellite")}</Option>
              <Option value="y">{t("superAdmin.objects.mapHybrid")}</Option>
              <Option value="p">{t("superAdmin.objects.mapTerrain")}</Option>
            </Select>
          </>
        )}
      </div>

      {apiError && <p style={{ color: "red", marginBottom: 8 }}>{apiError}</p>}

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
                cursor: previewImage ? "crosshair" : "default",
              }}
              onClick={handleImageClick}
            >
              {previewImage ? (
                <img
                  src={previewImage}
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

              {previewImage &&
                checkpoints
                  .filter((cp) => cp.position)
                  .map((point, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: `${point?.position?.yPercent}%`,
                        left: `${point?.position?.xPercent}%`,
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
                          backgroundColor: "#ef4444",
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
                        {point.name || `${i + 1}-punkt`}
                      </span>
                    </div>
                  ))}
            </div>
          )}

          {objectType === "MAP" && (
            <div style={{ height: "100%" }}>
              <MapContainerWrapper
                objectPosition={objectPosition}
                zoom={zoom}
                checkpoints={checkpoints}
                modalOpen={open}
                setZoom={setZoom}
                mapType={mapType}
                onObjectMove={(newPos) => setObjectPosition(newPos)}
                onAddCheckpoint={(lat, lng, index) => {
                  if (index !== undefined) {
                    setCheckpoints((prev) => {
                      const next = [...prev];
                      next[index] = { ...next[index], location: { lat, lng } };
                      return next;
                    });
                  } else {
                    const newIndex = checkpoints.length;
                    setCheckpoints((prev) => [
                      ...prev,
                      {
                        name: "",
                        normalTime: 15,
                        passTime: 2,
                        cardNumber: "",
                        location: { lat, lng },
                      },
                    ]);
                    setActiveKeys((prev) => [...prev, String(newIndex)]);
                    toast.success(
                      "🟢 " + t("superAdmin.objects.checkpointAdded"),
                    );
                  }
                }}
              />
            </div>
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
            {/* FIX 2 qo'shimcha: + tugmasi */}
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
                      // FIX 3: xato panel highlight
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
                            handleDeleteCheckpoint(cp.id, i);
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
                            <Option value="TOP">
                              {t("superAdmin.objects.styleTop")}
                            </Option>
                            <Option value="RIGHT">
                              {t("superAdmin.objects.styleRight")}
                            </Option>
                            <Option value="BOTTOM">
                              {t("superAdmin.objects.styleBottom")}
                            </Option>
                            <Option value="LEFT">
                              {t("superAdmin.objects.styleLeft")}
                            </Option>
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

          {/* FIX 2: Sticky footer — save tugmasi */}
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
            <Button type="primary" onClick={handleUpdate}>
              {t("superAdmin.objects.save")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditModal;
