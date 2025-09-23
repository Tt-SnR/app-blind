// src/routes/AppRouter.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { Layout, Menu, theme } from "antd";
import {
  UserOutlined,
  PieChartOutlined,
  BookOutlined,
} from "@ant-design/icons";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Books from "../pages/Books";

const { Header, Content, Footer, Sider } = Layout;

const AppRouter: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);


  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Router>
      <Layout style={{ minHeight: "100vh" }}>
        {/* Sidebar */}
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          <div className="logo" style={{ color: "white", textAlign: "center", margin: "16px" }}>
            Tâm Thư
          </div>
          <Menu
            theme="dark"
            defaultSelectedKeys={["dashboard"]}
            mode="inline"
            items={[
              { key: "dashboard", icon: <PieChartOutlined />, 
                label: <Link to="/dashboard">Trang chủ</Link>,
              },
              { key: "users", icon: <BookOutlined />,
                label: <Link to="/books">Sách nói</Link>,
              },
              { key: "books", icon: <UserOutlined />,
                label: <Link to="/users">Người dùng</Link>,
              },
            ]}
          />
        </Sider>

        {/* Main layout */}
        <Layout className="site-layout">
          {/* Header */}
          <Header style={{ padding: 0, background: colorBgContainer }} />

          {/* Content */}
          <Content style={{ margin: "16px" }}>
            <div
              style={{
                padding: 24,
                minHeight: 360,
                background: colorBgContainer,
              }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/books" element={<Books />} />
              </Routes>
            </div>
          </Content>

          {/* Footer */}
          <Footer style={{ textAlign: "center" }}>
            Admin Panel ©2025 Created by You
          </Footer>
        </Layout>
      </Layout>
    </Router>
  );
};

export default AppRouter;
