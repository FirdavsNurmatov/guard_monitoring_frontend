import { useState, useEffect } from "react";
import { Table, Space, Button, Popconfirm } from "antd";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { instance } from "../../../config/axios-instance";
import CreateModal from "./Components/CreateModal";
import EditModal from "./Components/EditModal";
import ViewModal from "./Components/ViewModal";

const Objects = () => {
  const { t } = useTranslation();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedObject, setSelectedObject] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // 🔹 Obyektlar ro‘yxatini yuklash
  const fetchObjects = async () => {
    try {
      const { data } = await instance.get("/superadmin/objects");
      setObjects(data?.data || []);
    } catch (err) {
      toast.error("❌ " + t("superAdmin.objects.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  // 🔹 Obyekt o‘chirish
  const handleDelete = async (id) => {
    try {
      await instance.delete(`/superadmin/object/${id}`);
      toast.success("🗑️ " + t("superAdmin.objects.deletedSuccess"));
      fetchObjects();
    } catch (err) {
      toast.error("❌ " + t("superAdmin.objects.deleteError"));
    }
  };

  const columns = [
    {
      title: t("superAdmin.objects.image"),
      render: (_, record) =>
        record?.imageUrl ? (
          <img
            src={`${import.meta.env.VITE_SERVER_PORT}${record?.imageUrl}`}
            alt="Obyekt rasmi"
            className="max-w-16"
          />
        ) : t("superAdmin.objects.noImage"),
    },
    { title: t("superAdmin.objects.name"), dataIndex: "name" },
    {
      title: t("superAdmin.objects.actions"),
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setSelectedObject(record);
              setIsViewModalOpen(true);
            }}
          >
            {t("superAdmin.objects.view")}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setSelectedObject(record);
              setIsEditModalOpen(true);
            }}
          >
            {t("superAdmin.objects.edit")}
          </Button>
          <Popconfirm
            title={t("superAdmin.objects.confirmDelete")}
            okText={t("common.yes")}
            cancelText={t("common.no")}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>{t("superAdmin.objects.delete")}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          {t("superAdmin.objects.createButton")}
        </Button>
      </div>

      <Table
        dataSource={objects}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: t("superAdmin.objects.emptyText") }}
      />

      {/* CREATE MODAL */}
      <CreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        fetchObjects={fetchObjects}
      />

      {/* EDIT MODAL */}
      <EditModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        objectData={selectedObject}
        fetchObjects={fetchObjects}
      />

      {/* VIEW MODAL */}
      <ViewModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        objectData={selectedObject}
      />
    </div>
  );
};

export default Objects;
