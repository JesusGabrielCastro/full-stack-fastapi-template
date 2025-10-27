import { Row, Col, Card, Statistic, Typography, Space, Table, Tag } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  InboxOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import useAuth from "@/hooks/useAuth";
import { ProductsService, MovementsService } from "../../client";

const { Title, Text } = Typography;

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

// Colores para los gráficos
const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

function Dashboard() {
  const { user: currentUser } = useAuth();

  // Queries para obtener datos
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: () => ProductsService.readProducts({ skip: 0, limit: 100 }),
  });

  const { data: movementsData } = useQuery({
    queryKey: ["recent-movements"],
    queryFn: () => MovementsService.readMovements({ skip: 0, limit: 10 }),
  });

  // Datos de ejemplo para gráficos (en producción vendrían del backend)
  const salesData = [
    { name: "Ene", ventas: 4000, compras: 2400 },
    { name: "Feb", ventas: 3000, compras: 1398 },
    { name: "Mar", ventas: 2000, compras: 9800 },
    { name: "Abr", ventas: 2780, compras: 3908 },
    { name: "May", ventas: 1890, compras: 4800 },
    { name: "Jun", ventas: 2390, compras: 3800 },
  ];

  const categoryData = [
    { name: "Electrónica", value: 400 },
    { name: "Ropa", value: 300 },
    { name: "Alimentos", value: 200 },
    { name: "Hogar", value: 278 },
  ];

  // Columnas para la tabla de movimientos recientes
  const movementColumns = [
    {
      title: "Producto",
      dataIndex: ["product", "name"],
      key: "product",
    },
    {
      title: "Tipo",
      dataIndex: "movement_type",
      key: "type",
      render: (type: string) => {
        const color =
          type === "VENTA"
            ? "red"
            : type === "COMPRA"
              ? "green"
              : type === "AJUSTE"
                ? "orange"
                : "blue";
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Fecha",
      dataIndex: "created_at",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString("es-ES"),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Saludo */}
      <div>
        <Title level={2} style={{ margin: 0 }}>
          ¡Hola, {currentUser?.full_name || currentUser?.email}! 👋
        </Title>
        <Text type="secondary">
          Bienvenido de nuevo, aquí está el resumen de tu inventario
        </Text>
      </div>

      {/* Tarjetas de estadísticas */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Productos"
              value={productsData?.count || 0}
              prefix={<InboxOutlined style={{ color: "#6366f1" }} />}
              valueStyle={{ color: "#6366f1" }}
              suffix={
                <Tag color="green" icon={<ArrowUpOutlined />}>
                  12%
                </Tag>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Ventas del Mes"
              value={15890}
              prefix={<DollarOutlined style={{ color: "#10b981" }} />}
              valueStyle={{ color: "#10b981" }}
              precision={2}
              suffix={
                <Tag color="green" icon={<ArrowUpOutlined />}>
                  8.5%
                </Tag>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Productos Bajos"
              value={8}
              prefix={<ShoppingCartOutlined style={{ color: "#f59e0b" }} />}
              valueStyle={{ color: "#f59e0b" }}
              suffix={
                <Tag color="orange" icon={<ArrowDownOutlined />}>
                  3
                </Tag>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Movimientos"
              value={movementsData?.count || 0}
              prefix={<UserOutlined style={{ color: "#8b5cf6" }} />}
              valueStyle={{ color: "#8b5cf6" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row gutter={[16, 16]}>
        {/* Gráfico de ventas y compras */}
        <Col xs={24} lg={16}>
          <Card
            title="Ventas y Compras - Últimos 6 meses"
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
                <Area
                  type="monotone"
                  dataKey="compras"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCompras)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Gráfico de productos por categoría */}
        <Col xs={24} lg={8}>
          <Card
            title="Productos por Categoría"
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name} ${(Number(percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tabla de movimientos recientes */}
      <Card
        title="Movimientos Recientes"
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        <Table
          columns={movementColumns}
          dataSource={movementsData?.data || []}
          rowKey="id"
          pagination={false}
          loading={!movementsData}
        />
      </Card>
    </Space>
  );
}

export default Dashboard;
