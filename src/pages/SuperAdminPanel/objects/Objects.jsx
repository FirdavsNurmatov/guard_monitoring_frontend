import { useState, useEffect } from "react";
import { Table, Space, Button, Popconfirm } from "antd";
import toast from "react-hot-toast";

import { instance } from "../../../config/axios-instance";
import CreateModal from "./Components/CreateModal";
import EditModal from "./Components/EditModal";
import ViewModal from "./Components/ViewModal";

const Objects = () => {
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
      toast.error("❌ Obyektlarni yuklashda xatolik yuz berdi");
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
      toast.success("🗑️ Obyekt muvaffaqiyatli o‘chirildi");
      fetchObjects();
    } catch (err) {
      toast.error("❌ Obyektni o‘chirishda xatolik yuz berdi");
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
          <Button
            onClick={() => {
              setSelectedObject(record);
              setIsViewModalOpen(true);
            }}
          >
            Ko‘rish
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setSelectedObject(record);
              setIsEditModalOpen(true);
            }}
          >
            Tahrirlash
          </Button>
          <Popconfirm
            title="Rostdan ham o'chirmoqchimisiz?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>O‘chirish</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          Yangi obyekt yaratish
        </Button>
      </div>

      <Table
        dataSource={objects}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: "Hech qanday obyekt topilmadi" }}
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
