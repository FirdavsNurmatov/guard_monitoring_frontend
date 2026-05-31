import { useEffect, useState } from "react";
import {
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
} from "antd";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Trash2, Edit, Eye, PowerOff } from "lucide-react";
import { instance } from "../../../config/axios-instance";
import { formatDate } from "../../../utils/dateFormat";
import { useGetUsers } from "../../../services/query/AdminPanel/Users/useGetUsers";
import { useCreateUser } from "../../../services/mutation/AdminPanel/Users/useCreateUser";
import { useDeleteUser } from "../../../services/mutation/AdminPanel/Users/useDeleteUser";
import { useInactivateUser } from "../../../services/mutation/AdminPanel/Users/useInactivateUser";
import { useEditUser } from "../../../services/mutation/AdminPanel/Users/useEditUser";
import "./Users.css";

const Users = () => {
  const { t, i18n } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState(null);

  const { data, isPending } = useGetUsers({
    onError: () => toast.error(t("messages.loadUsersError")),
  });

  const { mutate: createUser } = useCreateUser({
    onSuccess: () => {
      toast.success(t("messages.userCreated"));
      setIsFormModalOpen(false);
      form.resetFields();
    },
    onError: (error) => {
      const errText = error?.response?.data?.message?.includes("duplicate")
        ? t("errors.duplicateLogin")
        : t("messages.createUserError");
      toast.error(errText);
    },
  });

  const { mutate: editUser } = useEditUser({
    onSuccess: () => {
      toast.success(t("messages.userUpdated"));
      setIsFormModalOpen(false);
      form.resetFields();
    },
    onError: (error) => {
      const errText = error?.response?.data?.message?.includes("duplicate")
        ? t("errors.duplicateLogin")
        : t("messages.updateUserError");
      toast.error(errText);
    },
  });

  const { mutate: inactiveUser } = useInactivateUser({
    onSuccess: () => toast.success(t("messages.userDeactivated")),
    onError: () => toast.error(t("messages.deactivateUserError")),
  });

  const { mutate: deleteUser } = useDeleteUser({
    onSuccess: () => toast.success(t("messages.userDeleted")),
    onError: () => toast.error(t("messages.deleteUserError")),
  });

  // Ishlatish
  const handleSubmit = (values) => {
    if (formMode === "create") createUser(values);
    else editUser({ id: selected.id, values });
  };
  const handleDelete = (id) => deleteUser(id);
  const handleInactive = (id) => inactiveUser(id);

  const userColumns = [
    { title: t("usersPage.id"), dataIndex: "id" },
    { title: t("usersPage.login"), dataIndex: "login" },
    { title: t("usersPage.username"), dataIndex: "username" },
    {
      title: t("usersPage.role"),
      dataIndex: "role",
      render: (role) => {
        const roleMap = {
          ADMIN: t("usersPage.admin"),
          GUARD: t("usersPage.guard"),
          OPERATOR: t("usersPage.operator"),
        };
        return roleMap[role] || role;
      },
    },
    {
      title: t("usersPage.status"),
      dataIndex: "status",
      render: (status) =>
        status === "ACTIVE" ? (
          <p className="text-green-500">{t("common.active")}</p>
        ) : (
          <p className="text-red-500">{t("common.inactive")}</p>
        ),
    },
    {
      title: t("usersPage.createdDate"),
      dataIndex: "createdAt",
      render: (date) => formatDate(date, true),
    },
    {
      title: t("usersPage.actions"),
      render: (_, record) => (
        <Space>
          <Button
            className="btn-details"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => {
              setSelected(record);
              setIsModalOpen(true);
            }}
            title={t("usersPage.details")}
          />

          <Button
            className="btn-edit"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => {
              setSelected(record);
              setFormMode("edit");
              form.setFieldsValue(record);
              setSelectedRole(record.role);
              setIsFormModalOpen(true);
            }}
            title={t("usersPage.edit")}
          />

          <Popconfirm
            title={t("usersPage.confirmDelete")}
            okText={t("usersPage.yes")}
            cancelText={t("usersPage.no")}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
            icon={
              <span style={{ color: "#ef4444", fontSize: "18px" }}>⚠️</span>
            }
          >
            <Button
              className="btn-delete"
              icon={<Trash2 className="w-4 h-4" />}
              title={t("usersPage.delete")}
            />
          </Popconfirm>

          {record?.status === "ACTIVE" && (
            <Button
              className="btn-deactivate"
              icon={<PowerOff className="w-4 h-4" />}
              onClick={() => handleInactive(record.id)}
              title={t("usersPage.deactivate")}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-gray-950 p-6 relative">
      {/* Background effects like LandingPage */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1s"></div>
      </div>

      <div className="relative z-10 w-full px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {t("usersPage.title") || t("navigation.users")}
            </h1>
            <p className="text-gray-400 text-sm">
              {t("usersPage.subtitle") || t("dashboardPage.guards")}
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            className="btn-create"
            onClick={() => {
              setFormMode("create");
              setSelected(null);
              setSelectedRole(null);
              form.resetFields();
              setIsFormModalOpen(true);
            }}
          >
            + {t("usersPage.addUser")}
          </Button>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          <Table
            dataSource={data}
            rowKey={"id"}
            columns={userColumns}
            pagination={{
              showSizeChanger: false,
              showTotal: (total) => t("pagination.total", { count: total }),
              className: "dark-pagination pagination-dark",
            }}
            loading={isPending}
            className="dark-table table-large"
            size="middle"
            rowClassName={() => "dark-table-row"}
          />
        </div>
      </div>

      {/* Batafsil modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        title={
          <span className="text-white font-semibold">
            {t("usersPage.userDetails")}
          </span>
        }
        className="dark-modal modal-dark"
      >
        {selected && (
          <Descriptions
            bordered
            column={1}
            className="dark-descriptions"
            styles={{
              label: {
                backgroundColor: "#1f2937",
                color: "#9ca3af",
                borderColor: "#374151",
              },
              content: {
                backgroundColor: "#111827",
                color: "#f3f4f6",
                borderColor: "#374151",
              },
            }}
          >
            <Descriptions.Item label={t("usersPage.login")}>
              {selected.login}
            </Descriptions.Item>
            <Descriptions.Item label={t("usersPage.username")}>
              {selected.username}
            </Descriptions.Item>
            <Descriptions.Item label={t("usersPage.role")}>
              {selected.role}
            </Descriptions.Item>
            <Descriptions.Item label={t("usersPage.status")}>
              {selected.status === "ACTIVE" ? (
                <span className="text-emerald-400">{t("common.active")}</span>
              ) : (
                <span className="text-red-400">{t("common.inactive")}</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("usersPage.createdDate")}>
              {formatDate(selected.createdAt, true)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Qo‘shish / Tahrirlash modal */}
      <Modal
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        footer={null}
        title={
          <span className="text-white font-semibold">
            {formMode === "create"
              ? t("usersPage.newUser")
              : t("usersPage.editUser")}
          </span>
        }
        className="dark-modal modal-dark-backdrop"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="dark-form"
        >
          <Form.Item
            label={
              <span className="text-gray-300">{t("usersPage.username")}</span>
            }
            name="username"
          >
            <Input className="bg-gray-800 border-gray-600 text-white placeholder-gray-500" />
          </Form.Item>
          <Form.Item
            label={
              <span className="text-gray-300">{t("usersPage.login")}</span>
            }
            name="login"
            rules={[{ required: true, message: t("usersPage.enterLogin") }]}
          >
            <Input className="bg-gray-800 border-gray-600 text-white placeholder-gray-500" />
          </Form.Item>
          {formMode == "create" ? (
            <>
              <Form.Item
                label={
                  <span className="text-gray-300">
                    {t("usersPage.password")}
                  </span>
                }
                name="password"
                rules={[
                  { required: true, message: t("usersPage.enterPassword") },
                  {
                    validator: (_, value) => {
                      if (
                        selectedRole === "GUARD" &&
                        (!value || value.length !== 6)
                      ) {
                        return Promise.reject(t("errors.guardPasswordLength"));
                      }
                      if (
                        selectedRole === "GUARD" &&
                        value &&
                        !/^\d{6}$/.test(value)
                      ) {
                        return Promise.reject(t("errors.guardPasswordDigits"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password
                  maxLength={selectedRole === "GUARD" ? 6 : undefined}
                  placeholder={
                    selectedRole === "GUARD"
                      ? "6 ta raqam"
                      : t("usersPage.password")
                  }
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                />
              </Form.Item>
              <Form.Item
                label={
                  <span className="text-gray-300">{t("usersPage.role")}</span>
                }
                name="role"
                rules={[{ required: true, message: t("usersPage.selectRole") }]}
              >
                <Select
                  options={[
                    { label: t("usersPage.admin"), value: "ADMIN" },
                    { label: t("usersPage.guard"), value: "GUARD" },
                    { label: t("usersPage.operator"), value: "OPERATOR" },
                  ]}
                  onChange={(value) => {
                    setSelectedRole(value);
                    if (value !== "GUARD") {
                      form.setFieldsValue({ password: "" });
                    }
                  }}
                  className="dark-select"
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label={
                  <span className="text-gray-300">
                    {t("usersPage.newPassword")}
                  </span>
                }
                name="password"
                rules={[
                  { required: false },
                  {
                    validator: (_, value) => {
                      if (
                        value &&
                        selected?.role === "GUARD" &&
                        value.length !== 6
                      ) {
                        return Promise.reject(t("errors.guardPasswordLength"));
                      }
                      if (
                        value &&
                        selected?.role === "GUARD" &&
                        !/^\d{6}$/.test(value)
                      ) {
                        return Promise.reject(t("errors.guardPasswordDigits"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password
                  maxLength={selected?.role === "GUARD" ? 6 : undefined}
                  placeholder={
                    selected?.role === "GUARD"
                      ? t('usersPage.passwordChange.guardPlaceholder')
                      : t("usersPage.passwordChange.placeholder")
                  }
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                />
              </Form.Item>
              <Form.Item
                label={
                  <span className="text-gray-300">{t("usersPage.status")}</span>
                }
                name="status"
                rules={[
                  { required: true, message: t("usersPage.selectStatus") },
                ]}
              >
                <Select
                  options={[
                    { label: t("common.active"), value: "ACTIVE" },
                    { label: t("common.inactive"), value: "INACTIVE" },
                  ]}
                  className="dark-select"
                />
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Button htmlType="submit" block className="btn-create">
              {formMode === "create" ? t("common.add") : t("common.save")}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
