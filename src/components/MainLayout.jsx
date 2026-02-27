import { Button, Layout, Menu, Modal, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UsergroupAddOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const selectedKey = (() => {
    if (location.pathname.startsWith("/admin/users")) return "2";
    return "";
  })();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={250} trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            color: "white",
            textAlign: "center",
            padding: "16px 0",
            fontSize: "18px",
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          🛠️ Admin panel
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => {
            if (key === "4") {
              setLogoutOpen(true);
            }
          }}
          items={[
            {
              key: "2",
              icon: <UsergroupAddOutlined />,
              label: <Link to="/admin/users">Foydalanuvchilar</Link>,
            },
            {
              key: "3",
              icon: <DashboardOutlined />,
              label: <Link to="/monitoring">Kuzatuv paneli</Link>,
            },
            {
              key: "4",
              icon: <LogoutOutlined />,
              danger: true,
              label: <span onClick={() => setLogoutOpen(true)}>Chiqish</span>,
            },
          ]}
        />
        <Modal
          title="Tizimdan chiqmoqchimisiz?"
          open={logoutOpen}
          onOk={() => {
            localStorage.removeItem("auth");
            navigate("/", { replace: true });
          }}
          onCancel={() => setLogoutOpen(false)}
          okText="Ha, chiqish"
          cancelText="Bekor qilish"
          okType="danger"
          centered
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "18px",
              width: 64,
              height: 64,
            }}
          />
          <h3 style={{ marginLeft: 16 }}>Boshqaruv paneli</h3>
        </Header>

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
