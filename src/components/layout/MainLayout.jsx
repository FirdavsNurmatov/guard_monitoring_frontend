import { Button, Layout, Menu, Modal } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UsergroupAddOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { Shield } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useObjectStore } from "../../store/useObjectStore";
import i18n from "../../i18n/config";

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const resetAuth = useAuthStore((state) => state.resetAuth);
  const resetObjectSettings = useObjectStore((state) => state.resetObjectSettings);

  const selectedKey = (() => {
    if (location.pathname.startsWith("/admin/users")) return "1";
    if (location.pathname.startsWith("/admin/journal")) return "2";
    return "";
  })();

  return (
    <Layout
      style={{ height: "100vh", background: "#030712", overflow: "hidden" }}
    >
      {/* Background effects like LandingPage */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black pointer-events-none z-0"></div>
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1s"></div>
      </div>

      <Sider
        width={250}
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="sider-dark"
        style={{ height: "100vh", overflow: "auto" }}
      >
        <div className="flex items-center justify-center gap-2 py-4 border-b border-gray-700/50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-lg">
              {t("navigation.admin")}
            </span>
          )}
        </div>
        <div className="py-2">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            className="menu-dark"
            onClick={({ key }) => {
              if (key === "4") {
                setLogoutOpen(true);
              }
            }}
            items={[
              {
                key: "1",
                icon: <UsergroupAddOutlined />,
                label: (
                  <Link
                    to="/admin/users"
                    className="text-gray-300 hover:text-white text-base"
                  >
                    {t("navigation.users")}
                  </Link>
                ),
              },
              {
                key: "2",
                icon: <DashboardOutlined className="w-5 h-5" />,
                label: (
                  <Link
                    to="/admin/journal"
                    className="text-gray-300 hover:text-white text-base"
                  >
                    {t("dashboardPage.journal")}
                  </Link>
                ),
              },
              {
                key: "3",
                icon: <DashboardOutlined className="w-5 h-5" />,
                label: (
                  <Link
                    to="/monitoring"
                    className="text-gray-300 hover:text-white text-base"
                  >
                    {t("navigation.monitoring")}
                  </Link>
                ),
              },
              {
                key: "4",
                icon: <LogoutOutlined className="w-5 h-5" />,
                danger: true,
                label: (
                  <span className="text-red-400 text-base">
                    {t("common.logout")}
                  </span>
                ),
              },
            ]}
          />
        </div>
      </Sider>

      <Modal
        title={
          <span className="text-white font-semibold">
            {t("navigation.logout")}
          </span>
        }
        open={logoutOpen}
        onOk={() => {
          resetAuth();
          resetObjectSettings();
          i18n.changeLanguage('latin');
          localStorage.removeItem("auth");
          localStorage.removeItem("i18nextLng");
          document.cookie = "i18next=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          navigate("/", { replace: true });
        }}
        onCancel={() => setLogoutOpen(false)}
        okText={t("common.yes")}
        cancelText={t("common.cancel")}
        okType="danger"
        centered
        className="dark-modal modal-dark"
      />
      <Layout
        style={{
          background: "transparent",
          zIndex: 10,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          className="header-dark px-4"
          style={{ padding: "0 16px", flexShrink: 0 }}
        >
          <Button
            type="text"
            icon={
              collapsed ? (
                <MenuUnfoldOutlined className="text-white text-lg" />
              ) : (
                <MenuFoldOutlined className="text-white text-lg" />
              )
            }
            onClick={() => setCollapsed(!collapsed)}
            className="btn-toggle"
          />
          <h3 className="text-white font-semibold ml-4 text-xl">
            {t("common.dashboard")}
          </h3>
          <div className="ml-auto mr-4 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1 leading-none">
            <LanguageSwitcher />
          </div>
        </Header>

        <Content className="content-dark" style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
