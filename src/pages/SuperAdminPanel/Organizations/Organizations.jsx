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
import { formatDate } from "../../../utils/dateFormat";
import { useTranslation } from "react-i18next";
const { Option } = Select;

const Organizations = () => {
  const { t } = useTranslation();
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
        error?.response?.data?.message || t("superAdmin.organizations.loadError"),
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
      message.success(t("superAdmin.organizations.createdSuccess"));
      form.resetFields();
      setIsFormModalOpen(false);
      fetchOrganizations(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || t("superAdmin.organizations.error"));
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
      message.success(t("superAdmin.organizations.updatedSuccess"));
      setIsFormModalOpen(false);
      setSelectedOrg(null);
      form.resetFields();
      fetchOrganizations(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || t("superAdmin.organizations.error"));
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DELETE
  const handleDelete = async (id) => {
    try {
      await instance.delete(`/superadmin/organization/${id}`);
      message.success(t("superAdmin.organizations.deletedSuccess"));
      fetchOrganizations(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || t("superAdmin.organizations.deleteError"));
    }
  };

  // 🔹 INACTIVE
  const handleInactive = async (id) => {
    try {
      await instance.patch(`/superadmin/organization/${id}/status`, {
        status: "INACTIVE",
      });
      message.success(t("superAdmin.organizations.deactivatedSuccess"));
      fetchOrganizations(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || t("superAdmin.organizations.error"));
    }
  };

  const handleTableChange = (pag) => {
    fetchOrganizations(pag.current, pag.pageSize);
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: t("superAdmin.organizations.organizationName"), dataIndex: "name", key: "name" },
    {
      title: t("superAdmin.organizations.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => (value ? formatDate(value, true) : "-"),
    },
    {
      title: t("superAdmin.organizations.actions"),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={t("superAdmin.organizations.confirmDelete")}
            okText={t("common.yes")}
            cancelText={t("common.no")}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>{t("superAdmin.organizations.delete")}</Button>
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
            {t("superAdmin.organizations.edit")}
          </Button>

          <Button
            type="link"
            onClick={() => {
              setSelectedOrg(record);
              setIsDetailsModalOpen(true);
            }}
          >
            {t("superAdmin.organizations.view")}
          </Button>

          {record.status === "ACTIVE" && (
            <Button
              type="link"
              style={{ color: "#faad14" }}
              onClick={() => handleInactive(record.id)}
            >
              {t("superAdmin.organizations.deactivate")}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* ➕ CREATE */}
      <Card title={t("superAdmin.organizations.createTitle")} style={{ width: 350 }}>
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
          {t("superAdmin.organizations.createButton")}
        </Button>
      </Card>

      {/* 📋 LIST */}
      <Card title={t("superAdmin.organizations.title")} style={{ flex: 1 }}>
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
        title={t("superAdmin.organizations.detailsTitle")}
        open={isDetailsModalOpen}
        onCancel={() => setIsDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalOpen(false)}>
            {t("superAdmin.organizations.close")}
          </Button>,
        ]}
      >
        {selectedOrg ? (
          <div>
            <p>
              <strong>ID:</strong> {selectedOrg.id}
            </p>
            <p>
              <strong>{t("superAdmin.organizations.organizationName")}:</strong> {selectedOrg.name}
            </p>
            <p>
              <strong>{t("superAdmin.organizations.status")}:</strong> {selectedOrg.status}
            </p>
            <p>
              <strong>{t("superAdmin.organizations.createdAt")}:</strong> {" "}
              {formatDate(selectedOrg.createdAt, true)}
            </p>
            <p>
              <strong>{t("superAdmin.organizations.updatedAt")}:</strong> {" "}
              {formatDate(selectedOrg.updatedAt, true)}
            </p>
          </div>
        ) : (
          <p>{t("common.loading")}</p>
        )}
      </Modal>

      {/* 🔹 CREATE / EDIT FORM MODAL */}
      <Modal
        title={formMode === "edit" ? t("superAdmin.organizations.editTitle") : t("superAdmin.organizations.createTitle")}
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
            label={t("superAdmin.organizations.organizationName")}
            name="name"
            rules={[
              { required: true, message: t("superAdmin.organizations.enterName") },
              { min: 3, message: t("superAdmin.organizations.minChars") },
            ]}
          >
            <Input placeholder={t("superAdmin.organizations.placeholder")} />
          </Form.Item>

          {formMode === "edit" ? (
            <Form.Item label={t("superAdmin.organizations.status")} name="status">
              <Select placeholder={t("superAdmin.organizations.selectStatus")} allowClear>
                <Option value="ACTIVE">ACTIVE</Option>
                <Option value="INACTIVE">INACTIVE</Option>
              </Select>
            </Form.Item>
          ) : null}

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {formMode === "edit" ? t("superAdmin.organizations.save") : t("superAdmin.organizations.create")}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Organizations;
