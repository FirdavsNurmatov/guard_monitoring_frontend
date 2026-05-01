import { Modal, Table, Button } from "antd";
import MapContainerWrapper from "./MapContainerWrapper";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { instance } from "../../../../config/axios-instance";

const ViewModal = ({ open, onClose, objectData }) => {
  const { t } = useTranslation();

  const viewColumns = [
    {
      title: "№",
      key: "index",
      width: 40,
      fixed: "left",
      render: (_, __, index) => (
        <span style={{ color: "#6b7280", fontSize: 12 }}>{index + 1}</span>
      ),
    },
    {
      title: t("superAdmin.objects.name"),
      dataIndex: "name",
      width: 130,
      fixed: "left",
      render: (val) => (
        <span style={{ fontWeight: 600, color: "#1d4ed8" }}>{val}</span>
      ),
    },
    {
      title: t("superAdmin.objects.normalTime"),
      dataIndex: "normalTime",
      width: 80,
      align: "center",
      render: (val) => (
        <span
          style={{
            background: "#f0fdf4",
            color: "#16a34a",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {val ?? "—"} min
        </span>
      ),
    },
    {
      title: t("superAdmin.objects.passTime"),
      dataIndex: "passTime",
      width: 80,
      align: "center",
      render: (val) => (
        <span
          style={{
            background: "#fff7ed",
            color: "#ea580c",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {val ?? "—"} min
        </span>
      ),
    },
    {
      title: t("superAdmin.objects.cardNumber"),
      dataIndex: "cardNumber",
      width: 110,
      render: (val) => (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "#374151",
          }}
        >
          {val ?? "—"}
        </span>
      ),
    },
    {
      title: t("superAdmin.objects.positionTitle"),
      key: "position",
      width: 100,
      align: "center",
      render: (_, record) => (
        <span style={{ fontSize: 11, color: "#6b7280" }}>
          X: {record?.position?.xPercent ?? "—"}%
          <br />
          Y: {record?.position?.yPercent ?? "—"}%
        </span>
      ),
    },
    {
      title: t("superAdmin.objects.coordinateTitle"),
      key: "location",
      width: 130,
      align: "center",
      render: (_, record) => (
        <span
          style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}
        >
          {record?.location?.lat ?? "—"}
          <br />
          {record?.location?.lng ?? "—"}
        </span>
      ),
    },
  ];

  const [objectType, setObjectType] = useState("IMAGE");
  const [fullObject, setFullObject] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);

  useEffect(() => {
    if (!objectData?.id) return;
    const getOneObject = async () => {
      try {
        const { data } = await instance.get(
          `/superadmin/object/${objectData.id}`,
        );
        setFullObject(data);
        setCheckpoints(data?.checkpoints || []);
      } catch (err) {}
    };
    getOneObject();
  }, [objectData?.id]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={window.innerWidth * 0.99} // 1280px ekran uchun 1400 emas, 1200 optimal
      title={
        t("superAdmin.objects.viewTitle") +
        `: ${fullObject?.name || objectData?.name}`
      }
      style={{ top: 10 }}
    >
      {/* Toggle buttons */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
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
      </div>

      {/* Split layout: 65% rasm | 35% jadval */}
      <div style={{ display: "flex", gap: 12, height: "85vh" }}>
        {/* LEFT — 60% */}
        <div
          style={{
            flex: "0 0 60%",
            overflow: "hidden",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
          }}
        >
          {objectType === "IMAGE" && (
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor: "#f9fafb",
              }}
            >
              {fullObject?.imageUrl ? (
                <img
                  src={`${import.meta.env.VITE_SERVER_PORT}${fullObject?.imageUrl}`}
                  alt="map"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <span style={{ color: "#9ca3af" }}>
                    {t("superAdmin.objects.noImage")}
                  </span>
                </div>
              )}

              {fullObject?.imageUrl &&
                checkpoints.map((point, index) => (
                  <div
                    key={point.id || index}
                    style={{
                      position: "absolute",
                      top: `${point?.position?.yPercent ?? 5}%`,
                      left: `${point?.position?.xPercent ?? 10}%`,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        backgroundColor: "#3b82f6",
                        borderRadius: "50%",
                        border: "2px solid white",
                        zIndex: 10,
                        flexShrink: 0,
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
                      }}
                    >
                      {point.name || `${index + 1}-punkt`}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {objectType === "MAP" && (
            <div style={{ height: "100%" }}>
              <MapContainerWrapper
                objectPosition={fullObject?.position || objectData?.position}
                zoom={fullObject?.zoom || objectData?.zoom}
                checkpoints={checkpoints}
                modalOpen={open}
                attributionControl={false}
              />
            </div>
          )}
        </div>
        {/* RIGHT — 40% checkpoints jadvali */}
        {checkpoints.length > 0 && (
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
            </div>

            {/* Jadval */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              <Table
                rowKey={(record) => record.id || record.name}
                columns={viewColumns}
                dataSource={checkpoints}
                pagination={false}
                bordered={false}
                size="small"
                scroll={{ x: "max-content" }}
                sticky
                rowClassName={(_, index) =>
                  index % 2 === 0 ? "row-even" : "row-odd"
                }
              />
            </div>
          </div>
        )}{" "}
      </div>
    </Modal>
  );
};

export default ViewModal;
