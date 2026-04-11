import { Modal, Table, Button } from "antd";
import MapContainerWrapper from "./MapContainerWrapper";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { instance } from "../../../../config/axios-instance";

const ViewModal = ({ open, onClose, objectData }) => {
  const { t } = useTranslation();

  const viewColumns = [
    { title: t("superAdmin.objects.name"), dataIndex: "name" },
    { title: t("superAdmin.objects.normalTime") + " (min)", dataIndex: "normalTime" },
    { title: t("superAdmin.objects.passTime") + " (min)", dataIndex: "passTime" },
    { title: t("superAdmin.objects.cardNumber"), dataIndex: "cardNumber" },
    { title: "X %", dataIndex: ["position", "xPercent"] },
    { title: "Y %", dataIndex: ["position", "yPercent"] },
    { title: "Lat", dataIndex: ["location", "lat"] },
    { title: "Lng", dataIndex: ["location", "lng"] },
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
      } catch (err) {
        // console.error("Failed to fetch object:", err);
      }
    };

    getOneObject();
  }, [objectData?.id]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1400}
      title={t("superAdmin.objects.viewTitle") + `: ${fullObject?.name || objectData?.name}`}
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

      {objectType === "IMAGE" && (
        <div className="relative inline-block border rounded-xl shadow-md">
          {fullObject?.imageUrl ? (
            <img
              src={`${import.meta.env.VITE_SERVER_PORT}${fullObject?.imageUrl}`}
              alt="map"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          ) : (
            <div className="w-full h-full flex items-center m-2 justify-center">
              <span className="text-gray-500">{t("superAdmin.objects.noImage")}</span>
            </div>
          )}
          {fullObject?.imageUrl &&
            checkpoints.map((point, index) => (
              <div
                key={point.id || index}
                className="absolute flex"
                style={{
                  top: `${point?.position?.yPercent ?? 5}%`,
                  left: `${point?.position?.xPercent ?? 10}%`,
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
          objectPosition={fullObject?.position || objectData?.position}
          zoom={fullObject?.zoom || objectData?.zoom}
          checkpoints={checkpoints}
          modalOpen={open}
          attributionControl={false}
        />
      )}

      {checkpoints.length > 0 && (
        <Table
          className="mt-4"
          rowKey={(record) => record.id || record.name}
          columns={viewColumns}
          dataSource={checkpoints}
          pagination={false}
          bordered
          size="middle"
          scroll={{ x: true }}
        />
      )}
    </Modal>
  );
};

export default ViewModal;
