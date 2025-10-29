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
  theme,
  Popover,
  List,
  Tag,
  Empty,
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
  WarningOutlined,
} from "@ant-design/icons";
import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserPublic, AlertPublic } from "@/client";
import { isLoggedIn } from "@/hooks/useAuth";
import useAuth from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AlertsService, ProductsService } from "@/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

const { Header, Sider, Content } = Layout;
const { useToken } = theme;

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
  const [alertsOpen, setAlertsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useRouterState({
    select: (state) => state.location,
  });
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const { token } = useToken();

  // Query para alertas activas
  const { data: alertsData } = useQuery({
    queryKey: ["active-alerts"],
    queryFn: () => AlertsService.readActiveAlerts(),
    refetchInterval: 30000, // Refetch cada 30 segundos
  });

  // Query para productos (para mostrar nombres en alertas)
  const { data: productsData } = useQuery({
    queryKey: ["products-alerts"],
    queryFn: () =>
      ProductsService.readProducts({
        skip: 0,
        limit: 1000,
      }),
  });

  // Mutación para resolver alerta
  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) =>
      AlertsService.resolveAlert({
        id: alertId,
        requestBody: {
          is_resolved: true,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const handleResolveAlert = (alertId: string) => {
    resolveAlertMutation.mutate(alertId);
  };

  // Crear mapa de productos
  const productsMap = new Map(
    productsData?.data.map((prod) => [prod.id, prod]) || []
  );

  // Detectar si el tema es oscuro basándose en el color de fondo
  const isDarkMode = (() => {
    const bgColor = token.colorBgContainer;
    // Convertir hex a RGB y calcular luminosidad
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminosity < 0.5; // Si la luminosidad es menor a 0.5, es oscuro
  })();

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
      key: "/alerts",
      icon: <WarningOutlined />,
      label: "Alertas",
      badge: alertsData?.count || 0,
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

  // Obtener la clave seleccionada del menú según la ruta actual
  const getSelectedKey = () => {
    const pathname = location.pathname;
    // Buscar coincidencia exacta primero
    const exactMatch = menuItems.find((item) => item.key === pathname);
    if (exactMatch) return [pathname];

    // Si no hay coincidencia exacta, buscar la más cercana
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const firstSegment = `/${segments[0]}`;
      const match = menuItems.find((item) => item.key === firstSegment);
      if (match) return [firstSegment];
    }

    // Por defecto, seleccionar el dashboard
    return ["/"];
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
      alerts: "Alertas",
      reports: "Reportes",
      users: "Usuarios",
      settings: "Configuración",
    };

    pathSegments.forEach((segment: any) => {
      if (pathMap[segment]) {
        items.push({
          title: pathMap[segment],
          href: "",
        });
      }
    });

    return items;
  };

  // Contenido del popover de alertas
  const alertsContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: "auto" }}>
      {alertsData && alertsData.data.length > 0 ? (
        <>
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${token.colorBorder}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600 }}>
              Alertas Activas ({alertsData.count})
            </span>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setAlertsOpen(false);
                navigate({ to: "/alerts" });
              }}
            >
              Ver todas
            </Button>
          </div>
          <List
            dataSource={alertsData.data.slice(0, 5)}
            renderItem={(alert: AlertPublic) => {
              const product = productsMap.get(alert.product_id);
              return (
                <List.Item
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                  }}
                  onClick={() => {
                    setAlertsOpen(false);
                    navigate({ to: "/products" });
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <WarningOutlined
                        style={{
                          fontSize: 24,
                          color:
                            alert.alert_type === "OUT_OF_STOCK"
                              ? "#ef4444"
                              : "#f59e0b",
                        }}
                      />
                    }
                    title={
                      <Space direction="vertical" size={0}>
                        <span style={{ fontWeight: 500 }}>
                          {product?.name || "Producto desconocido"}
                        </span>
                        <Tag
                          color={
                            alert.alert_type === "OUT_OF_STOCK"
                              ? "red"
                              : "orange"
                          }
                          style={{ marginRight: 0 }}
                        >
                          {alert.alert_type === "OUT_OF_STOCK"
                            ? "Sin Stock"
                            : "Stock Bajo"}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <span style={{ fontSize: 12, color: "#999" }}>
                          Stock: {alert.current_stock} / Mín: {alert.min_stock}
                        </span>
                        <span style={{ fontSize: 11, color: "#bbb" }}>
                          {dayjs(alert.created_at).fromNow()}
                        </span>
                      </Space>
                    }
                  />
                  {user?.is_superuser && (
                    <Button
                      type="link"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolveAlert(alert.id);
                      }}
                      loading={resolveAlertMutation.isPending}
                    >
                      Resolver
                    </Button>
                  )}
                </List.Item>
              );
            }}
          />
        </>
      ) : (
        <Empty
          description="No hay alertas activas"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: 20 }}
        />
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={isDarkMode ? "dark" : "light"}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "sticky",
          left: 0,
          top: 0,
          bottom: 0,
        }}
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
            color: isDarkMode ? "#fff" : token.colorPrimary,
            borderBottom: `1px solid ${token.colorBorder}`,
          }}
        >
          {collapsed ? "📦" : "📦 Inventory"}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          theme={isDarkMode ? "dark" : "light"}
          selectedKeys={getSelectedKey()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            marginTop: 16,
          }}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          style={{
            padding: "0 24px",
            background: token.colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${token.colorBorder}`,
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

            {/* Alertas */}
            <Popover
              content={alertsContent}
              trigger="click"
              placement="bottomRight"
              open={alertsOpen}
              onOpenChange={setAlertsOpen}
              arrow={false}
            >
              <Badge count={alertsData?.count || 0}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: "18px" }} />}
                  style={{ width: 40, height: 40 }}
                />
              </Badge>
            </Popover>

            {/* Usuario */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar
                  style={{ backgroundColor: token.colorPrimary }}
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
