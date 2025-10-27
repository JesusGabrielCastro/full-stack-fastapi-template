import { useState } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Button,
  Space,
  Breadcrumb,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  TagsOutlined,
  SwapOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { UserPublic } from "@/client";
import { isLoggedIn } from "@/hooks/useAuth";
import useAuth from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const { Header, Sider, Content } = Layout;

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function LayoutComponent() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const currentUser =
    queryClient.getQueryData<UserPublic>(["currentUser"]) || user;

  // Menú items
  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/products",
      icon: <ShoppingOutlined />,
      label: "Productos",
    },
    {
      key: "/categories",
      icon: <TagsOutlined />,
      label: "Categorías",
    },
    {
      key: "/movements",
      icon: <SwapOutlined />,
      label: "Movimientos",
    },
    {
      key: "/reports",
      icon: <BarChartOutlined />,
      label: "Reportes",
    },
    ...(currentUser?.is_superuser
      ? [
          {
            key: "/users",
            icon: <TeamOutlined />,
            label: "Usuarios",
          },
        ]
      : []),
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Configuración",
    },
  ];

  // Dropdown del usuario
  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Mi Perfil",
      onClick: () => navigate({ to: "/settings" }),
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Cerrar Sesión",
      onClick: logout,
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate({ to: key });
  };

  // Obtener el path actual para el breadcrumb
  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const items = [
      {
        title: "Inicio",
        href: "/",
      },
    ];

    const pathMap: Record<string, string> = {
      products: "Productos",
      categories: "Categorías",
      movements: "Movimientos",
      reports: "Reportes",
      users: "Usuarios",
      settings: "Configuración",
    };

    pathSegments.forEach((segment: any) => {
      if (pathMap[segment]) {
        items.push({
          title: pathMap[segment],
          href: ""
        });
      }
    });

    return items;
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "sticky",
          left: 0,
          top: 0,
          bottom: 0,
        }}
        theme="light"
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: collapsed ? 20 : 24,
            fontWeight: "bold",
            color: "#6366f1",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {collapsed ? "📦" : "📦 Inventory"}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 16 }}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />

          <Space size="middle">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notificaciones */}
            <Badge count={0} showZero={false}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: "18px" }} />}
                style={{ width: 40, height: 40 }}
              />
            </Badge>

            {/* Usuario */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar
                  style={{ backgroundColor: "#6366f1" }}
                  icon={<UserOutlined />}
                >
                  {currentUser?.full_name?.charAt(0) ||
                    currentUser?.email?.charAt(0)}
                </Avatar>
                <span style={{ fontWeight: 500 }}>
                  {currentUser?.full_name || currentUser?.email}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
          }}
        >
          {/* Breadcrumb */}
          {location.pathname !== "/" && (
            <Breadcrumb
              items={getBreadcrumbItems()}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Outlet */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default LayoutComponent;
