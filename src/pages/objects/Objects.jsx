import { useRef, useEffect, useState } from "react";
import {
  Button,
  Upload,
  Input,
  InputNumber,
  Modal,
  Table,
  Space,
  Popconfirm,
  Form,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { instance } from "../../config/axios-instance";
import toast from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Select } from "antd";
const { Option } = Select;

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

/* Leaflet wrapper component */
const MapContainerWrapper = ({
  objectPosition,
  zoom,
  checkpoints,
  modalOpen,
  setZoom,
  onAddCheckpoint,
  mapType = "y",
}) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (modalOpen && mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
        if (objectPosition) {
          mapRef.current.setView(
            [objectPosition.lat, objectPosition.lng],
            zoom,
          );
        }
      }, 500);
    }
  }, [modalOpen, objectPosition, zoom]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]); // 🔥 zoom o‘zgarganda sinxron bo‘lsin

  const mapClickHandler = (e) => {
    if (onAddCheckpoint) {
      const { lat, lng } = e.latlng;
      onAddCheckpoint(lat, lng);
    }
  };

  return (
    <MapContainer
      center={[objectPosition?.lat || 41.31, objectPosition?.lng || 69.28]}
      zoom={zoom || 15}
      whenCreated={(mapInstance) => {
        mapRef.current = mapInstance;
        mapInstance.on("click", mapClickHandler);
        if (setZoom) {
          mapInstance.on("zoomend", () => setZoom(mapInstance.getZoom()));
        }
      }}
      style={{ height: "500px", width: "100%" }}
      zoomControl
      scrollWheelZoom
      attributionControl={false}
    >
      <TileLayer
        url={`https://mt1.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
        attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
      />
      {objectPosition && (
        <Marker
          position={[objectPosition.lat, objectPosition.lng]}
          icon={objectIcon}
        />
      )}
      {checkpoints?.map((cp, i) =>
        cp.location ? (
          <Marker
            key={i}
            position={[cp.location.lat, cp.location.lng]}
            icon={L.divIcon({
              className: "",
              html: `<div style="
                background: blue;
                width:16px;
                height:16px;
                border-radius:50%;
                border:2px solid white;
                display:flex;
                align-items:center;
                justify-content:center;">
              </div>`,
            })}
          >
            <Tooltip permanent direction="top">
              {cp.name || `${i + 1}-punkt`}
            </Tooltip>
          </Marker>
        ) : null,
      )}
    </MapContainer>
  );
};

const Objects = () => {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(15); // default 15

  const [objectId, setObjectId] = useState(null);
  const [objectType, setObjectType] = useState("IMAGE"); // default IMAGE
  const [objectPosition, setObjectPosition] = useState(null);
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [objectName, setObjectName] = useState("");
  const [mapType, setMapType] = useState("y"); // 🗺️ default: hybrid

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [apiError, setApiError] = useState("");
  const [cardNumberErrors, setCardNumberErrors] = useState({});

  // 🔹 Leaflet uchun marker joylash komponenti
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;

        if (!objectPosition) {
          // 1️⃣ Birinchi nuqta — objectning o‘zi
          setObjectPosition({ lat, lng });
          toast.success("📍 Object joylashuvi belgilandi");
        } else {
          // 2️⃣ Keyingi nuqtalar — checkpoints
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
        }
        toast.success("🟢 Yangi punkt qo‘shildi");
      },
    });

    return (
      <>
        {/* Object marker (qizil) */}
        {objectPosition && (
          <Marker
            position={[objectPosition.lat, objectPosition.lng]}
            icon={objectIcon}
          />
        )}

        {/* Checkpoints (yashil) */}
        {checkpoints.map(
          (cp, i) =>
            cp?.location?.lat &&
            cp?.location?.lng && (
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

  const fetchObjects = async () => {
    try {
      const res = await instance.get("/object");
      setObjects(res.data);
    } catch (err) {
      toast.error("❌ Obyektlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckpoints = async (id, type) => {
    try {
      const objectRes = await instance.get(`/object/${id}`);
      const data = objectRes.data;

      setObjectId(data?.id);
      setObjectName(data?.name);
      setImage(
        data?.imageUrl
          ? `${import.meta.env.VITE_SERVER_PORT}${data?.imageUrl}`
          : null,
      );
      setObjectType(data?.type || "IMAGE");
      setObjectPosition(data?.position || null);
      setZoom(data?.zoom || 15);

      const res = await instance.get(`/checkpoint?objectId=${id}`);

      setCheckpoints(res.data.res || []);

      if (type === "view") setIsViewModalOpen(true);
      if (type === "edit") setIsEditModalOpen(true);
    } catch (err) {
      toast.error("❌ Obyekt ma’lumotlarini yuklashda xatolik yuz berdi");
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setObjectName("");
    setImage(null);
    setObjectId(null);
    setCheckpoints([]);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setObjectName("");
    setImage(null);
    setObjectId(null);
    setCheckpoints([]);
    setObjectPosition(null);
  };

  // 🚀 Faqat preview qilish (serverga yubormaydi)
  const handleMapUpload = (info) => {
    const selectedFile = info.file.originFileObj || info.file;
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);

    setObjectId(null);
    setCheckpoints([]);
  };

  const handleSubmit = async () => {
    try {
      // 1️⃣ cardNumber tekshiruvi
      const cardNumbers = checkpoints
        .map((cp) => cp.cardNumber)
        .filter(Boolean);

      const duplicates = cardNumbers.filter(
        (cn, idx) => cardNumbers.indexOf(cn) !== idx,
      );

      if (duplicates.length > 0) {
        toast.error(
          `❌ Bunday karta raqami allaqachon mavjud: ${duplicates[0]}`,
        );
        setApiError(`Karta raqami takrorlanmoqda: ${duplicates[0]}`);
        return;
      }

      // 2️⃣ Bo‘sh  name uchun default qiymat beramiz
      const updatedCheckpoints = checkpoints.map((cp, i) => ({
        ...cp,
        name: cp.name?.trim() || `${i + 1}-punkt`,
      }));

      // 3️⃣ FormData tayyorlash
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("name", objectName?.trim() || `Obyekt-${Date.now()}`);
      formData.append("zoom", zoom.toString());
      formData.append("type", objectType);

      if (objectPosition) {
        formData.append("position", JSON.stringify(objectPosition));
      }

      // 4️⃣ Object yaratish
      const res = await instance.post("/object", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const createdObjectId = res.data?.id;

      // 6️⃣ Checkpointlarni parallel yuboramiz
      try {
        await Promise.all(
          updatedCheckpoints.map((cp) =>
            instance.post("/checkpoint", {
              ...cp,
              objectId: createdObjectId,
            }),
          ),
        );
      } catch (err) {
        const cardNumber = err?.response?.data?.message.split(":")[1];

        if (cardNumber) {
          setCardNumberErrors((prev) => ({
            ...prev,
            [cardNumber]: "Bu card number allaqachon mavjud",
          }));
        }

        await instance.delete(`/object/${createdObjectId}`);
        toast.error("❌ Punkt yaratishda xatolik");
        return;
      }

      // 7️⃣ Muvaffaqiyatli natija
      toast.success("✅ Obyekt va punktlar muvaffaqiyatli yaratildi!");
      fetchObjects();
      setIsCreateModalOpen(false);
      setApiError("");
    } catch (err) {
      if (err?.response?.data?.message?.includes("Duplicate"))
        setApiError("Karta raqami takrorlanmoqda");
      toast.error(
        "❌ Obyekt yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.",
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await instance.delete(`/object/${id}`);
      toast.success("🗑️ Obyekt muvaffaqiyatli o‘chirildi");
      fetchObjects();
    } catch (err) {
      toast.error("❌ Obyektni o‘chirishda xatolik yuz berdi");
    }
  };

  const handleUpdate = async () => {
    try {
      // 🔎 Duplicate cardNumber check
      const cardNumbers = checkpoints
        .map((cp) => cp.cardNumber)
        .filter(Boolean); // faqat to'ldirilganlarni olamiz

      const duplicates = cardNumbers.filter(
        (cn, idx) => cardNumbers.indexOf(cn) !== idx,
      );

      if (duplicates.length > 0) {
        toast.error(
          `❌ Bunday karta raqami allaqachon mavjud: ${duplicates[0]}`,
        );
        setApiError(`Karta raqami takrorlanmoqda: ${duplicates[0]}`);
        return;
      }

      // 🔄 Object update
      await instance.patch(`/object/${objectId}`, {
        name: objectName,
        zoom,
      });

      for (const cp of checkpoints) {
        if (cp.id) {
          const { id, createdAt, updatedAt, ...data } = cp;
          await instance.patch(`/checkpoint/${cp.id}`, {
            ...data,
            objectId,
          });
        } else {
          await instance.post("/checkpoint", {
            ...cp,
            objectId, // 🔗 mavjud objectga bog‘lash
          });
        }
      }

      toast.success("✅ Obyekt muvaffaqiyatli yangilandi");
      setIsEditModalOpen(false);
      fetchObjects();
      setApiError("");
    } catch (err) {
      if (err?.response?.data?.message.includes("Duplicate")) {
        setApiError("Karta raqami takrorlanmoqda");
        toast.error("❌ Ikkita bir xil karta raqami mavjud");
      } else {
        toast.error(
          "❌ Obyektni yangilashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.",
        );
      }
    }
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

  const handleChange = (index, field, value) => {
    const newCheckpoints = [...checkpoints];
    newCheckpoints[index][field] = value;
    setCheckpoints(newCheckpoints);
  };

  const handleDeleteCheckpoint = async (id) => {
    try {
      await instance.delete(`/checkpoint/${id}`);
      toast.success("🗑️ Punkt muvaffaqiyatli o‘chirildi");
      setCheckpoints(checkpoints.filter((cp) => cp.id !== id));
    } catch (err) {
      toast.error("❌ Punktni o‘chirishda xatolik yuz berdi");
    }
  };

  const columns = [
    {
      title: "Rasm",
      render: (_, record) => (
        <img
          src={`${import.meta.env.VITE_SERVER_PORT}${record?.imageUrl}`}
          alt="Obyekt rasmi"
          className="max-w-16"
        />
      ),
    },
    { title: "Nomi", dataIndex: "name" },
    {
      title: "Amallar",
      render: (_, record) => (
        <Space>
          <Button onClick={() => fetchCheckpoints(record.id, "view")}>
            Ko'rish
          </Button>
          <Button
            type="primary"
            onClick={() => fetchCheckpoints(record.id, "edit")}
          >
            Tahrirlash
          </Button>
          <Popconfirm
            title="Rostdan ham o'chirmoqchimisiz?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>O'chirish</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const viewColumns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Normal time (min)",
      dataIndex: "normalTime",
    },
    {
      title: "Pass time (min)",
      dataIndex: "passTime",
    },
    {
      title: "Card number",
      dataIndex: "cardNumber",
    },
    {
      title: "X %",
      dataIndex: ["position", "xPercent"],
    },
    {
      title: "Y %",
      dataIndex: ["position", "yPercent"],
    },
    {
      title: "Lat",
      dataIndex: ["location", "lat"],
    },
    {
      title: "Lng",
      dataIndex: ["location", "lng"],
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button
          type="primary"
          onClick={() => (setIsCreateModalOpen(true), openCreateModal())}
        >
          Yangi obyekt yaratish
        </Button>
      </div>

      {/* Table  */}
      <Table
        dataSource={objects}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: "Hech qanday obyekt topilmadi" }}
      />

      {/* CREATE MODAL */}
      <Modal
        open={isCreateModalOpen}
        onCancel={handleCloseCreateModal}
        footer={null}
        width={1400}
        title="🗺️ Yangi obyekt yaratish"
        style={{ top: 10 }}
      >
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Obyekt nomini kiriting"
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
          />

          <div>
            {objectType === "IMAGE"
              ? "🖼️ Rasm ko'rinishi"
              : "🗺️ Xarita ko'rinishi"}
          </div>

          {objectType === "IMAGE" && (
            <Upload
              accept="image/*"
              beforeUpload={() => false}
              onChange={handleMapUpload}
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Rasm yuklash</Button>
            </Upload>
          )}

          {objectType === "MAP" && (
            <div className="flex items-center gap-3 mt-2">
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
                <Option value="m">🛣️ Odatdagi</Option>
                <Option value="s">🛰️ Sattelit</Option>
                <Option value="y">🌍 Hybrid</Option>
                <Option value="p">⛰️ Terrain</Option>
              </Select>
            </div>
          )}

          {/* 🔹 type = MAP bo‘lsa — Leaflet chiqadi */}
          {objectType === "MAP" && (
            <>
              <div className="mt-4 border rounded-lg overflow-hidden">
                <MapContainer
                  center={[41.31, 69.28]}
                  zoom={zoom}
                  whenCreated={(map) => {
                    map.on("zoomend", () => setZoom(map.getZoom())); // 🧠 zoom har safar o‘zgarganda saqlab boradi
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
              </div>
              <div>
                Lat: {objectPosition?.lat}; Lng: {objectPosition?.lng}
              </div>
            </>
          )}
        </div>

        {/* 🔹 IMAGE bo‘lsa rasm ustiga checkpoint qo‘yish */}
        {objectType === "IMAGE" && isCreateModalOpen && image && (
          <div
            className="relative inline-block border rounded-xl shadow-md cursor-crosshair mt-4"
            onClick={handleImageClick}
          >
            <img
              src={image}
              alt="map"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            {checkpoints?.map((point, index) => (
              <div
                key={index}
                className="absolute flex"
                style={{
                  top: `${point?.position?.yPercent || 5}%`,
                  left: `${point?.position?.xPercent || 10}%`,
                }}
              >
                <div className="w-4 h-4 z-10 bg-green-500 rounded-full border-2 border-white shadow" />
                <span className="text-xs bg-white px-1 rounded shadow">
                  {point.name || `${index + 1}-punkt`}
                </span>
              </div>
            ))}
          </div>
        )}

        {checkpoints.length > 0 && (
          <div className="mt-4 space-y-2">
            {checkpoints?.map((cp, i) => (
              <div
                key={i}
                className="flex flex-wrap gap-3 items-center border p-2 rounded"
              >
                <Input
                  placeholder="Checkpoint name"
                  value={cp.name || `${i + 1}-punkt`}
                  onChange={(e) => handleChange(i, "name", e.target.value)}
                  style={{ width: "200px" }}
                />
                <InputNumber
                  min={1}
                  value={cp.normalTime}
                  onChange={(val) => handleChange(i, "normalTime", val)}
                  addonAfter="min"
                  style={{ width: "120px" }}
                />
                <InputNumber
                  min={1}
                  value={cp.passTime}
                  onChange={(val) => handleChange(i, "passTime", val)}
                  addonAfter="min"
                  style={{ width: "120px" }}
                />
                <Form.Item
                  validateStatus={
                    cardNumberErrors[cp.cardNumber] ? "error" : ""
                  }
                  help={cardNumberErrors[cp.cardNumber]}
                >
                  <Input
                    placeholder="Card number"
                    value={cp.cardNumber}
                    onChange={(e) => {
                      handleChange(i, "cardNumber", e.target.value);

                      setCardNumberErrors((prev) => {
                        const next = { ...prev };
                        delete next[cp.cardNumber];
                        return next;
                      });
                    }}
                    style={{ width: "150px" }}
                  />
                </Form.Item>
                <InputNumber
                  min={0}
                  max={100}
                  value={cp?.position?.xPercent || 0}
                  onChange={(val) =>
                    handleChange(i, "position", {
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
                  value={cp?.position?.yPercent || 0}
                  onChange={(val) =>
                    handleChange(i, "position", {
                      ...cp.position,
                      yPercent: val,
                    })
                  }
                  addonAfter="Y%"
                  style={{ width: "120px" }}
                />
                <InputNumber
                  placeholder="Lat"
                  value={cp?.location?.lat || 0}
                  onChange={(val) =>
                    handleChange(i, "location", {
                      ...cp.location,
                      lat: val,
                    })
                  }
                  addonAfter="Lat"
                />
                <InputNumber
                  placeholder="Lng"
                  value={cp?.location?.lng || 0}
                  onChange={(val) =>
                    handleChange(i, "location", {
                      ...cp.location,
                      lng: val,
                    })
                  }
                  addonAfter="Lng"
                />

                {/* X ni qo‘shamiz */}
                <Button
                  danger
                  onClick={() => {
                    // Agar serverda id bo‘lsa, API orqali o‘chirish
                    if (cp.id) handleDeleteCheckpoint(cp.id);
                    // Client-side arraydan o‘chirish
                    setCheckpoints(checkpoints.filter((_, idx) => idx !== i));
                  }}
                >
                  🗑️
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
            <Button type="primary" onClick={handleSubmit}>
              Create
            </Button>
            <Button onClick={handleCloseCreateModal}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={null}
        width={1400}
        title={`View Object: ${objectName}`}
        style={{ top: 10 }}
      >
        <div className="mt-2 mb-2 flex gap-3">
          <Button type="default" onClick={() => setObjectType("IMAGE")}>
            ⬅️
          </Button>
          <Button type="default" onClick={() => setObjectType("MAP")}>
            ➡️
          </Button>
        </div>

        {objectType === "IMAGE" && isViewModalOpen && image && (
          <div className="relative inline-block border rounded-xl shadow-md">
            <img
              src={image}
              alt="map"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            {checkpoints?.map((point, index) => (
              <div
                key={index}
                className="absolute flex"
                style={{
                  top: `${point?.position?.yPercent || 5}%`,
                  left: `${point?.position?.xPercent || 10}%`,
                }}
              >
                <div className="w-4 h-4 z-10 bg-blue-500 rounded-full border-2 border-white shadow" />
                <span className="mt-1 text-xs bg-white px-1 rounded shadow">
                  {point.name || `${index + 1}-punkt`}
                </span>
              </div>
            ))}
          </div>
        )}

        {objectType === "MAP" && (
          <MapContainerWrapper
            objectPosition={objectPosition}
            zoom={zoom}
            checkpoints={checkpoints}
            modalOpen={isViewModalOpen}
            setZoom={setZoom} // 🔥 qo‘shildi
            attributionControl={false}
            mapType={mapType}
          />
        )}

        {checkpoints.length > 0 && (
          <Table
            rowKey={(_, i) => i}
            columns={viewColumns}
            dataSource={checkpoints}
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: true }}
          />
        )}
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        title={`Obyektni tahrirlash: ${objectName}`}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
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

        {objectType === "IMAGE" && image && isEditModalOpen && (
          <div
            className="mt-4 relative inline-block border rounded-xl shadow-md cursor-crosshair"
            onClick={handleImageClick}
          >
            <img
              src={image}
              alt="map"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            {checkpoints?.map((point, index) => (
              <div
                key={index}
                className="absolute flex"
                style={{
                  top: `${point?.position?.yPercent || 5}%`,
                  left: `${point?.position?.xPercent || 10}%`,
                }}
              >
                <div className="w-4 h-4 z-10 bg-red-500 rounded-full border-2 border-white shadow" />
                <span className="mt-1 text-xs bg-white px-1 rounded shadow">
                  {point?.name || `${index + 1}-punkt`}
                </span>
              </div>
            ))}
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
              modalOpen={isEditModalOpen}
              setZoom={setZoom}
              mapType={mapType}
              onAddCheckpoint={(lat, lng) => {
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
                  value={cp.name || `${i + 1}-punkt`}
                  onChange={(e) => handleChange(i, "name", e.target.value)}
                  style={{ width: "25%" }}
                />
                <InputNumber
                  min={1}
                  value={cp.normalTime}
                  onChange={(val) => handleChange(i, "normalTime", val)}
                  addonAfter="min"
                  style={{ width: "120px" }}
                />
                <InputNumber
                  min={1}
                  value={cp.passTime}
                  onChange={(val) => handleChange(i, "passTime", val)}
                  addonAfter="min"
                  style={{ width: "120px" }}
                />
                <Input
                  placeholder="Card number"
                  value={cp.cardNumber}
                  onChange={(e) =>
                    handleChange(i, "cardNumber", e.target.value)
                  }
                  style={{ width: "25%" }}
                />

                <InputNumber
                  min={0}
                  max={100}
                  value={cp?.position?.xPercent || 0}
                  onChange={(val) =>
                    handleChange(i, "position", {
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
                  value={cp?.position?.yPercent || 0}
                  onChange={(val) =>
                    handleChange(i, "position", {
                      ...cp.position,
                      yPercent: val,
                    })
                  }
                  addonAfter="Y%"
                  style={{ width: "120px" }}
                />
                <InputNumber
                  placeholder="Lat"
                  value={cp?.location?.lat || 0}
                  onChange={(val) =>
                    handleChange(i, "location", {
                      ...cp.location,
                      lat: val,
                    })
                  }
                  addonAfter="Lat"
                />
                <InputNumber
                  placeholder="Lng"
                  value={cp?.location?.lng || 0}
                  onChange={(val) =>
                    handleChange(i, "location", {
                      ...cp.location,
                      lng: val,
                    })
                  }
                  addonAfter="Lng"
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
                  🗑️
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
            <Button onClick={() => setIsEditModalOpen(false)}>
              Bekor qilish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Objects;
