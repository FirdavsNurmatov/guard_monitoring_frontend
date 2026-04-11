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
import { useTranslation } from "react-i18next";

const { Option } = Select;

const Users = () => {
  const { t } = useTranslation();
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
        error?.response?.data?.message || t("superAdmin.organizations.loadError"),
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
        error?.response?.data?.message || t("superAdmin.users.loadError"),
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
        message.success(t("superAdmin.users.updatedSuccess"));
      } else {
        await instance.post("/superadmin/admin", {
          username: values.username,
          login: values.login,
          password: values.password,
          organizationId: values?.organizationId,
        });
        message.success(t("superAdmin.users.createdSuccess"));
      }

      form.resetFields();
      setIsFormModalOpen(false);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || t("superAdmin.users.error"));
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DELETE user
  const handleDelete = async (id) => {
    try {
      await instance.delete(`/superadmin/admin/${id}`);
      message.success(t("superAdmin.users.deletedSuccess"));
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || t("superAdmin.users.deleteError"));
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
      title: t("superAdmin.users.username"),
      dataIndex: "username",
      key: "username",
    },
    {
      title: t("superAdmin.users.login"),
      dataIndex: "login",
      key: "login",
    },
    {
      title: t("superAdmin.users.organization"),
      dataIndex: "organization",
      key: "organization",
      render: (org) => org?.name || "Global",
    },
    {
      title: t("superAdmin.users.role"),
      dataIndex: "role",
      key: "role",
    },
    {
      title: t("superAdmin.users.actions"),
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
            {t("superAdmin.users.edit")}
          </Button>

          <Popconfirm
            title={t("superAdmin.users.confirmDelete")}
            description={t("superAdmin.users.cannotUndo")}
            okText={t("common.yes")}
            cancelText={t("common.no")}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
            icon={<span style={{ color: '#ef4444', fontSize: '18px' }}>⚠️</span>}
          >
            <Button danger>{t("superAdmin.users.delete")}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
      {/* 📋 LIST */}
      <Card title={t("superAdmin.users.title")}>
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
          {t("superAdmin.users.createButton")}
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
        title={formMode === "edit" ? t("superAdmin.users.editTitle") : t("superAdmin.users.createTitle")}
        open={isFormModalOpen}
        onCancel={() => {
          setIsFormModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={t("superAdmin.users.username")}
            name="username"
            rules={[{ message: t("superAdmin.users.enterUsername") }]}
          >
            <Input placeholder={t("superAdmin.users.usernamePlaceholder")} />
          </Form.Item>

          <Form.Item
            label={t("superAdmin.users.login")}
            name="login"
            rules={[{ required: true, message: t("superAdmin.users.enterLogin") }]}
          >
            <Input placeholder={t("superAdmin.users.loginPlaceholder")} />
          </Form.Item>

          <Form.Item
            label={t("superAdmin.users.password")}
            name="password"
            rules={
              formMode === "create"
                ? [
                    { required: true, message: t("superAdmin.users.enterPassword") },
                    { min: 6, message: t("superAdmin.users.minChars") },
                  ]
                : []
            }
          >
            <Input.Password
              placeholder={
                formMode === "edit"
                  ? t("superAdmin.users.passwordOptional")
                  : t("superAdmin.users.passwordPlaceholder")
              }
            />
          </Form.Item>

          <Form.Item label={t("superAdmin.users.organization")} name="organizationId">
            <Select placeholder={t("superAdmin.users.selectOrganization")}>
              <Option value={null}>{t("superAdmin.users.globalAdmin")}</Option>
              {organizations.map((org) => (
                <Option key={org.id} value={org.id}>
                  {org.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {formMode === "edit" ? t("superAdmin.users.save") : t("superAdmin.users.create")}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
