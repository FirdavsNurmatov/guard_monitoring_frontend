import { Button, Layout, Menu, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  PictureOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";

const { Header, Sider, Content } = Layout;

export default function SuperAdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKey = (() => {
    if (location.pathname.startsWith("/superadmin/organizations")) return "1";
    if (location.pathname.startsWith("/superadmin/objects")) return "2";
    if (location.pathname.startsWith("/superadmin/users")) return "3";
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
          Super Admin panel
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: "1",
              icon: <PictureOutlined />,
              label: (
                <Link to="/superadmin/organizations">Organizatsiyalar</Link>
              ),
            },
            {
              key: "2",
              icon: <PictureOutlined />,
              label: <Link to="/superadmin/objects">Obyektlar</Link>,
            },
            {
              key: "3",
              icon: <UsergroupAddOutlined />,
              label: <Link to="/superadmin/users">Foydalanuvchilar</Link>,
            },
          ]}
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
