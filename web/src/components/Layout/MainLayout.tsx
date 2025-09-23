// src/components/Layout/MainLayout.tsx
import React, { useState } from "react";
import { Layout, Menu, theme } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { DesktopOutlined, UserOutlined, PieChartOutlined } from "@ant-design/icons";

const { Header, Sider, Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo" style={{ color: "white", textAlign: "center", margin: "16px" }}>
          Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["dashboard"]}
          onClick={(e) => navigate(`/${e.key}`)}
          items={[
            { key: "dashboard", icon: <PieChartOutlined />, label: "Dashboard" },
            { key: "users", icon: <UserOutlined />, label: "Users" },
            { key: "projects", icon: <DesktopOutlined />, label: "Projects" },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "16px" }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>
            <Outlet /> {/* Render Page */}
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>Admin Dashboard ©2025</Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
