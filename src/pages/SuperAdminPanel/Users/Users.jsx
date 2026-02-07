import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Select,
  Table,
  Space,
  Popconfirm,
  Modal,
} from "antd";
import { instance } from "../../../config/axios-instance";

const { Option } = Select;

const Users = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create | edit
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 🔹 GET organizations
  const fetchOrganizations = async () => {
    try {
      const { data } = await instance.get("/superadmin/organizations");
      setOrganizations(data?.data || []);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Organizationlarni olishda xatolik",
      );
    }
  };

  // 🔹 GET users with pagination
  const fetchUsers = async (page = 1, pageSize = 10) => {
    try {
      setListLoading(true);
      const { data } = await instance.get(
        `/superadmin/admins?page=${page}&pageSize=${pageSize}`,
      );
      setUsers(data?.data || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: data?.total || 0,
      }));
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Foydalanuvchilarni olishda xatolik",
      );
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchUsers();
  }, []);

  // 🔹 CREATE / UPDATE user
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (formMode === "edit") {
        await instance.patch(`/superadmin/admin/${selected.id}`, {
          username: values.username,
          login: values.login,
          password: values.password || undefined, // optional
          organizationId: values?.organizationId,
        });
        message.success("Admin yangilandi");
      } else {
        await instance.post("/superadmin/admin", {
          username: values.username,
          login: values.login,
          password: values.password,
          organizationId: values?.organizationId,
        });
        message.success("Admin yaratildi");
      }

      form.resetFields();
      setIsFormModalOpen(false);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DELETE user
  const handleDelete = async (id) => {
    try {
      await instance.delete(`/superadmin/admin/${id}`);
      message.success("Admin o‘chirildi");
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || "O‘chirishda xatolik");
    }
  };

  const handleTableChange = (pag) => {
    fetchUsers(pag.current, pag.pageSize);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Login",
      dataIndex: "login",
      key: "login",
    },
    {
      title: "Organization",
      dataIndex: "organization",
      key: "organization",
      render: (org) => org?.name || "Global",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setSelected(record);
              setFormMode("edit");
              form.setFieldsValue({
                username: record.username,
                login: record.login,
                password: "",
                organizationId: record.organization?.id,
              });
              setIsFormModalOpen(true);
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
    <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
      {/* 📋 LIST */}
      <Card title="Admins">
        <Button
          type="primary"
          style={{ marginBottom: 16 }}
          onClick={() => {
            setFormMode("create");
            setSelected(null);
            form.resetFields();
            setIsFormModalOpen(true);
          }}
        >
          Create Admin
        </Button>

        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={listLoading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* ➕ CREATE / EDIT MODAL */}
      <Modal
        title={formMode === "edit" ? "Tahrirlash" : "Create Admin"}
        open={isFormModalOpen}
        onCancel={() => {
          setIsFormModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ message: "Ism kiriting" }]}
          >
            <Input placeholder="Masalan: John Doe" />
          </Form.Item>

          <Form.Item
            label="Login"
            name="login"
            rules={[{ required: true, message: "Login kiriting" }]}
          >
            <Input placeholder="Masalan: john@example.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={
              formMode === "create"
                ? [
                    { required: true, message: "Parol kiriting" },
                    { min: 6, message: "Kamida 6 ta belgi bo‘lishi kerak" },
                  ]
                : []
            }
          >
            <Input.Password
              placeholder={
                formMode === "edit"
                  ? "O'zgartirish uchun kiriting (optional)"
                  : "********"
              }
            />
          </Form.Item>

          <Form.Item label="Organization" name="organizationId">
            <Select placeholder="Organization tanlang (optional)">
              <Option value={null}>Global admin (no organization)</Option>
              {organizations.map((org) => (
                <Option key={org.id} value={org.id}>
                  {org.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {formMode === "edit" ? "Saqlash" : "Create Admin"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
