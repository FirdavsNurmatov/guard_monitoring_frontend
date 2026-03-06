import { Modal, Input, Button, InputNumber, Select } from "antd";
import toast from "react-hot-toast";
import MapContainerWrapper from "./MapContainerWrapper";
import { useState, useEffect } from "react";
import { instance } from "../../../../config/axios-instance";
import { Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";

const { Option } = Select;

const EditModal = ({ open, onClose, objectData, fetchObjects }) => {
  const [fullObject, setFullObject] = useState(null); // ✅ backend’dan keladigan full object
  const [objectName, setObjectName] = useState("");
  const [objectType, setObjectType] = useState("IMAGE");
  const [zoom, setZoom] = useState(15);
  const [mapType, setMapType] = useState("y");
  const [checkpoints, setCheckpoints] = useState([]);
  const [objectPosition, setObjectPosition] = useState(null);
  const [apiError, setApiError] = useState("");
  const [cardNumberErrors, setCardNumberErrors] = useState({});
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // ✅ objectData o‘zgarganda backend’dan full object fetch
  useEffect(() => {
    if (!objectData?.id) return;

    const fetchFullObject = async () => {
      try {
        const { data } = await instance.get(
          `/superadmin/object/${objectData.id}`,
        );
        setFullObject(data);
      } catch (err) {
        // console.error("Failed to fetch object:", err);
      }
    };

    fetchFullObject();
  }, [objectData?.id]);

  // ✅ fullObject o‘zgarganda state’larni yangilash
  useEffect(() => {
    if (!fullObject) return;

    setObjectName(fullObject.name || "");
    setObjectType(fullObject.type || "IMAGE");
    setZoom(fullObject.zoom || 15);
    setObjectPosition(fullObject.position || null);
    setCheckpoints(fullObject.checkpoints || []);

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
      toast.success("Rasm o‘chirildi");
    } catch {
      toast.error("Rasmni o‘chirishda xatolik");
    }
  };

  const handleAddCheckpoint = (lat, lng) => {
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
    toast.success("🟢 Yangi punkt qo‘shildi");
  };

  const handleChangeCheckpoint = (index, field, value) => {
    const newCheckpoints = [...checkpoints];
    newCheckpoints[index][field] = value;
    setCheckpoints(newCheckpoints);
  };

  const handleImageClick = (e) => {
    if (!image) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCheckpoints([
      ...checkpoints,
      {
        name: "",
        normalTime: 15,
        passTime: 2,
        position: {
          xPercent: +x.toFixed(2),
          yPercent: +y.toFixed(2),
        },
      },
    ]);
  };

  const handleDeleteCheckpoint = async (id) => {
    try {
      if (id) await instance.delete(`/superadmin/checkpoint/${id}`);
      setCheckpoints(checkpoints.filter((data) => data.id !== id));
      toast.success("🗑️ Punkt o‘chirildi");
    } catch (err) {
      toast.error("❌ Punktni o‘chirishda xatolik");
    }
  };

  const handleUpdate = async () => {
    setCardNumberErrors({});
    setApiError("");

    try {
      // 1️⃣ Duplicate card number tekshirish
      const cardNumbers = checkpoints
        .map((cp) => cp.cardNumber)
        .filter(Boolean);
      const duplicates = cardNumbers.filter(
        (cn, idx) => cardNumbers.indexOf(cn) !== idx,
      );
      if (duplicates.length > 0) {
        toast.error(`❌ Duplicate card number: ${duplicates[0]}`);
        setCardNumberErrors({ [duplicates[0]]: "Duplicate" });
        return;
      }

      // 2️⃣ Bo‘sh name uchun default qiymat beramiz
      const updatedCheckpoints = checkpoints.map((cp, i) => ({
        ...cp,
        name: cp.name?.trim() || `${i + 1}-punkt`,
        position: cp?.position || { xPercent: 15, yPercent: 15 },
        location: cp?.location || { lat: 41.3, lng: 69.3 },
      }));

      // 3️⃣ Object update
      await instance.patch(`/superadmin/object/${fullObject.id}`, {
        name: objectName,
        position: objectPosition,
        zoom,
      });

      // 🔥 Agar yangi file bo‘lsa — image update
      if (file) {
        const fd = new FormData();
        fd.append("file", file);

        await instance.post(`/superadmin/object/${fullObject.id}/image`, fd);
      }

      // 4️⃣ Checkpoints update/create
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

      toast.success("✅ Obyekt yangilandi");
      onClose();
    } catch (err) {
      const data = err?.response?.data;

      if (data?.cardNumber) {
        setCardNumberErrors({ [data?.cardNumber]: "Duplicate" });
        setApiError(`${data.cardNumber} - bu karta raqami allaqachon mavjud`);
      } else if (data?.message) {
        setApiError(data.message);
      } else {
        setApiError("Noma'lum xatolik");
      }

      toast.error("❌ Yangilashda xatolik yuz berdi");
    }
  };

  return (
    <Modal
      title={`Obyektni tahrirlash: ${objectName}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1400}
      style={{ top: 10 }}
    >
      <div className="mb-4">
        <Input
          placeholder="Obyekt nomi"
          value={objectName}
          onChange={(e) => setObjectName(e.target.value)}
        />
      </div>

      {objectType === "IMAGE" && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex justify-start gap-3">
            {/* Upload button */}
            <Upload
              accept="image/*"
              beforeUpload={() => false}
              onChange={handleImageUpload}
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                {previewImage ? "Rasmni almashtirish" : "Rasm yuklash"}
              </Button>
            </Upload>

            {previewImage && (
              <Popconfirm
                title="Rasmni o‘chirmoqchimisiz?"
                description="Bu amalni ortga qaytarib bo‘lmaydi"
                onConfirm={handleRemoveImage}
                okText="Ha"
                cancelText="Yo‘q"
                okButtonProps={{ danger: true }}
              >
                <Button danger>🗑️ Rasmni o‘chirish</Button>
              </Popconfirm>
            )}
          </div>

          {/* Preview */}
          {previewImage && (
            <div
              className="relative border rounded-xl shadow-md cursor-crosshair overflow-hidden"
              onClick={handleImageClick}
              style={{ maxHeight: "80vh" }}
            >
              <img
                src={previewImage}
                alt="object"
                className="w-full object-contain rounded-xl"
              />

              {checkpoints
                ?.filter((cp) => cp.position)
                .map((point, index) => (
                  <div
                    key={index}
                    className="absolute flex flex-col items-center"
                    style={{
                      top: `${point?.position?.yPercent}%`,
                      left: `${point?.position?.xPercent}%`,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow" />
                    <span className="mt-1 text-xs bg-white px-1 rounded shadow">
                      {point?.name || `${index + 1}-punkt`}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {objectType === "MAP" && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span>Zoom:</span>
            <InputNumber
              min={0}
              max={18}
              value={zoom}
              onChange={(val) => setZoom(val)}
            />
            <Select
              value={mapType}
              onChange={setMapType}
              style={{ width: 180 }}
            >
              <Option value="m">🛣️ Oddiy</Option>
              <Option value="s">🛰️ Sun'iy yo'ldosh</Option>
              <Option value="y">🌍 Aralash</Option>
              <Option value="p">⛰️ Relyef</Option>
            </Select>
          </div>
          <MapContainerWrapper
            objectPosition={objectPosition}
            zoom={zoom}
            checkpoints={checkpoints}
            modalOpen={open}
            setZoom={setZoom}
            mapType={mapType}
            onObjectMove={(newPos) => setObjectPosition(newPos)} // 🆕 Obyektni surish funksiyasi
            onAddCheckpoint={(lat, lng, index) => {
              if (index !== undefined) {
                // Checkpoint pozitsiyasini yangilash
                setCheckpoints((prev) => {
                  const next = [...prev];
                  next[index] = { ...next[index], location: { lat, lng } };
                  return next;
                });
              } else {
                // Yangi checkpoint qo'shish
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
                toast.success("🟢 Yangi punkt qo‘shildi");
              }
            }}
          />
        </>
      )}

      {apiError && <p className="text-[red] text-2xl">{apiError}</p>}

      {/* Checkpoints form */}
      {checkpoints.length > 0 && (
        <div className="mt-6 space-y-3">
          {checkpoints.map((cp, i) => (
            <div
              key={i}
              className="flex flex-wrap gap-3 items-center border p-2 rounded"
            >
              <Input
                placeholder="Checkpoint name"
                value={cp.name}
                onChange={(e) =>
                  handleChangeCheckpoint(i, "name", e.target.value)
                }
                style={{ width: "20%" }}
              />
              <InputNumber
                min={1}
                value={cp.normalTime}
                onChange={(val) => handleChangeCheckpoint(i, "normalTime", val)}
                addonAfter="min"
                style={{ width: "120px" }}
              />
              <InputNumber
                min={1}
                value={cp.passTime}
                onChange={(val) => handleChangeCheckpoint(i, "passTime", val)}
                addonAfter="min"
                style={{ width: "120px" }}
              />
              <Input
                placeholder="Card number"
                value={cp.cardNumber}
                onChange={(e) =>
                  handleChangeCheckpoint(i, "cardNumber", e.target.value)
                }
                status={cardNumberErrors[cp.cardNumber] ? "error" : ""}
                style={{ width: "20%" }}
              />

              <Select
                value={cp.infoStyle || "TOP"} // ✅ default enum qiymati
                onChange={(val) => handleChangeCheckpoint(i, "infoStyle", val)}
                style={{ width: 120 }}
              >
                <Option value="TOP">Yuqorida</Option>
                <Option value="RIGHT">O'ngda</Option>
                <Option value="BOTTOM">Pastda</Option>
                <Option value="LEFT">Chapda</Option>
              </Select>

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
                style={{ width: "120px" }}
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
                style={{ width: "120px" }}
              />

              <Button
                danger
                onClick={() => {
                  // Agar serverda id bo‘lsa, API orqali o‘chirish
                  if (cp.id) handleDeleteCheckpoint(cp.id);
                  // Client-side arraydan o‘chirish
                  setCheckpoints(checkpoints.filter((_, idx) => idx !== i));
                }}
              >
                O'chirish
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <div className="mt-4 flex gap-3">
          <Button type="default" onClick={() => setObjectType("IMAGE")}>
            ⬅️
          </Button>
          <Button type="default" onClick={() => setObjectType("MAP")}>
            ➡️
          </Button>
        </div>

        <div className="mt-4 flex gap-3">
          <Button type="primary" onClick={handleUpdate}>
            Saqlash
          </Button>
          <Button onClick={onClose}>Bekor qilish</Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditModal;
