import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Table,
  Space,
  Popconfirm,
  Modal,
  Select,
} from "antd";
import { instance } from "../../../config/axios-instance";
const { Option } = Select;

const Organizations = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit'
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 🔹 GET organizations
  const fetchOrganizations = async (page = 1, pageSize = 10) => {
    try {
      setListLoading(true);
      const { data } = await instance.get("/superadmin/organizations", {
        params: { page, limit: pageSize },
      });

      setOrganizations(data?.data || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: data?.total || 0, // backenddan total count qaytishi kerak
      }));
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Organizationlarni olishda xatolik",
      );
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations(pagination.current, pagination.pageSize);
  }, []);

  // 🔹 CREATE
  const handleCreate = async (values) => {
    try {
      setLoading(true);
      await instance.post("/superadmin/organization", { name: values.name });
      message.success("Organization muvaffaqiyatli yaratildi");
      form.resetFields();
      setIsFormModalOpen(false);
      fetchOrganizations(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 EDIT
  const handleEditSubmit = async (values) => {
    try {
      if (!selectedOrg) return;
      setLoading(true);
      await instance.patch(`/superadmin/organization/${selectedOrg.id}`, {
        name: values.name,
        status: values.status,
      });
      message.success("Organization yangilandi");
      setIsFormModalOpen(false);
      setSelectedOrg(null);
      form.resetFields();
      fetchOrganizations(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DELETE
  const handleDelete = async (id) => {
    try {
      await instance.delete(`/superadmin/organization/${id}`);
      message.success("Organization o‘chirildi");
      fetchOrganizations(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || "O‘chirishda xatolik");
    }
  };

  // 🔹 INACTIVE
  const handleInactive = async (id) => {
    try {
      await instance.patch(`/superadmin/organization/${id}/status`, {
        status: "INACTIVE",
      });
      message.success("Organization nofaollashtirildi");
      fetchOrganizations(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleTableChange = (pag) => {
    fetchOrganizations(pag.current, pag.pageSize);
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Organization name", dataIndex: "name", key: "name" },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Rostdan ham o'chirmoqchimisiz?"
            okText="Ha"
            cancelText="Yo‘q"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>O‘chirish</Button>
          </Popconfirm>

          <Button
            type="link"
            onClick={() => {
              setSelectedOrg(record);
              form.setFieldsValue(record);
              setFormMode("edit");
              setIsFormModalOpen(true);
            }}
          >
            Tahrirlash
          </Button>

          <Button
            type="link"
            onClick={() => {
              setSelectedOrg(record);
              setIsDetailsModalOpen(true);
            }}
          >
            Batafsil
          </Button>

          {record.status === "ACTIVE" && (
            <Button
              type="link"
              style={{ color: "#faad14" }}
              onClick={() => handleInactive(record.id)}
            >
              Nofaollashtirish
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* ➕ CREATE */}
      <Card title="Create Organization" style={{ width: 350 }}>
        <Button
          type="primary"
          block
          onClick={() => {
            setFormMode("create");
            setSelectedOrg(null);
            form.resetFields();
            setIsFormModalOpen(true);
          }}
        >
          Create New Organization
        </Button>
      </Card>

      {/* 📋 LIST */}
      <Card title="Organizations" style={{ flex: 1 }}>
        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={organizations}
          loading={listLoading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* 🔹 DETAILS MODAL */}
      <Modal
        title="Organization Details"
        open={isDetailsModalOpen}
        onCancel={() => setIsDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalOpen(false)}>
            Yopish
          </Button>,
        ]}
      >
        {selectedOrg ? (
          <div>
            <p>
              <strong>ID:</strong> {selectedOrg.id}
            </p>
            <p>
              <strong>Name:</strong> {selectedOrg.name}
            </p>
            <p>
              <strong>Status:</strong> {selectedOrg.status}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(selectedOrg.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Updated At:</strong>{" "}
              {new Date(selectedOrg.updatedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Modal>

      {/* 🔹 CREATE / EDIT FORM MODAL */}
      <Modal
        title={formMode === "edit" ? "Tahrirlash" : "Create Organization"}
        open={isFormModalOpen}
        onCancel={() => {
          setIsFormModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={formMode === "edit" ? handleEditSubmit : handleCreate}
        >
          <Form.Item
            label="Organization name"
            name="name"
            rules={[
              { required: true, message: "Organization nomini kiriting" },
              { min: 3, message: "Kamida 3 ta belgi bo‘lishi kerak" },
            ]}
          >
            <Input placeholder="Masalan: CityNet" />
          </Form.Item>

          {formMode === "edit" ? (
            <Form.Item label="Status" name="status">
              <Select placeholder="Statusni tanlang (optional)" allowClear>
                <Option value="ACTIVE">ACTIVE</Option>
                <Option value="INACTIVE">INACTIVE</Option>
              </Select>
            </Form.Item>
          ) : null}

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {formMode === "edit" ? "Saqlash" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Organizations;
