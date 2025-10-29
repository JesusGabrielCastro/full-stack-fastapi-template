import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Space,
  Tabs,
  Table,
  Tag,
  Empty,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  CalendarOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import { ReportsService, MovementsService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const { RangePicker } = DatePicker;

export const Route = createFileRoute("/_layout/reports")({
  component: Reports,
});

function Reports() {
  const { contextHolder } = useNotification();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  // Query para reporte de ventas
  const {
    data: salesData,
    isLoading: salesLoading,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ["sales-report", dateRange],
    queryFn: () =>
      ReportsService.getSalesReport({
        start_date: dateRange?.[0].toISOString(),
        end_date: dateRange?.[1].toISOString(),
      }),
    enabled: !!dateRange,
  });

  // Query para reporte de compras
  const {
    data: purchasesData,
    isLoading: purchasesLoading,
    refetch: refetchPurchases,
  } = useQuery({
    queryKey: ["purchases-report", dateRange],
    queryFn: () =>
      ReportsService.getPurchasesReport({
        start_date: dateRange?.[0].toISOString(),
        end_date: dateRange?.[1].toISOString(),
      }),
    enabled: !!dateRange,
  });

  // Query para movimientos de ventas detallados
  const { data: salesMovements } = useQuery({
    queryKey: ["sales-movements", dateRange],
    queryFn: () =>
      MovementsService.readMovements({
        skip: 0,
        limit: 100,
        movement_type: "SALIDA_VENTA",
        start_date: dateRange?.[0].toISOString(),
        end_date: dateRange?.[1].toISOString(),
      }),
    enabled: !!dateRange,
  });

  // Query para movimientos de compras detallados
  const { data: purchasesMovements } = useQuery({
    queryKey: ["purchases-movements", dateRange],
    queryFn: () =>
      MovementsService.readMovements({
        skip: 0,
        limit: 100,
        movement_type: "ENTRADA_COMPRA",
        start_date: dateRange?.[0].toISOString(),
        end_date: dateRange?.[1].toISOString(),
      }),
    enabled: !!dateRange,
  });

  const handleRefresh = () => {
    refetchSales();
    refetchPurchases();
  };

  const handleExport = (type: "sales" | "purchases") => {
    // Aquí iría la lógica para exportar a Excel/PDF
    console.log(`Exportando reporte de ${type}`);
  };

  const salesColumns = [
    {
      title: "Fecha",
      dataIndex: "movement_date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Producto",
      dataIndex: "product_id",
      key: "product",
      ellipsis: true,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty: number) => <Tag color="red">-{qty}</Tag>,
    },
    {
      title: "Precio Unit.",
      dataIndex: "unit_price",
      key: "unit_price",
      render: (price: string | null) =>
        price ? `$${parseFloat(price).toFixed(2)}` : "-",
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (total: string | null) =>
        total ? (
          <span style={{ fontWeight: 600, color: "#ef4444" }}>
            ${parseFloat(total).toFixed(2)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Referencia",
      dataIndex: "reference_number",
      key: "reference",
      render: (ref: string | null) => ref || "-",
    },
  ];

  const purchasesColumns = [
    {
      title: "Fecha",
      dataIndex: "movement_date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Producto",
      dataIndex: "product_id",
      key: "product",
      ellipsis: true,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty: number) => <Tag color="green">+{qty}</Tag>,
    },
    {
      title: "Precio Unit.",
      dataIndex: "unit_price",
      key: "unit_price",
      render: (price: string | null) =>
        price ? `$${parseFloat(price).toFixed(2)}` : "-",
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (total: string | null) =>
        total ? (
          <span style={{ fontWeight: 600, color: "#10b981" }}>
            ${parseFloat(total).toFixed(2)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Referencia",
      dataIndex: "reference_number",
      key: "reference",
      render: (ref: string | null) => ref || "-",
    },
  ];

  const salesTab = (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Estadísticas de Ventas */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Ventas"
              value={salesData?.total_sales || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#ef4444" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Cantidad Total Vendida"
              value={salesData?.total_items_sold || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: "#6366f1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Promedio por Venta"
              value={
                salesData?.total_items_sold && salesData.total_items_sold > 0
                  ? Number(salesData.total_sales || 0) / salesData.total_items_sold
                  : 0
              }
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#f59e0b" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Ventas Detalladas */}
      <Card
        title="Detalle de Ventas"
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExport("sales")}
          >
            Exportar
          </Button>
        }
        bordered={false}
      >
        {salesMovements?.data && salesMovements.data.length > 0 ? (
          <Table
            columns={salesColumns}
            dataSource={salesMovements.data}
            rowKey="id"
            loading={salesLoading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} ventas`,
            }}
          />
        ) : (
          <Empty description="No hay ventas en el período seleccionado" />
        )}
      </Card>
    </Space>
  );

  const purchasesTab = (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Estadísticas de Compras */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Compras"
              value={purchasesData?.total_purchases || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#10b981" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Cantidad Total Comprada"
              value={purchasesData?.total_items_purchased || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#6366f1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false}>
            <Statistic
              title="Promedio por Compra"
              value={
                purchasesData?.total_items_purchased &&
                purchasesData.total_items_purchased > 0
                  ? (purchasesData.total_items_purchased || 0) /
                    purchasesData.total_items_purchased
                  : 0
              }
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#f59e0b" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Compras Detalladas */}
      <Card
        title="Detalle de Compras"
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExport("purchases")}
          >
            Exportar
          </Button>
        }
        bordered={false}
      >
        {purchasesMovements?.data && purchasesMovements.data.length > 0 ? (
          <Table
            columns={purchasesColumns}
            dataSource={purchasesMovements.data}
            rowKey="id"
            loading={purchasesLoading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} compras`,
            }}
          />
        ) : (
          <Empty description="No hay compras en el período seleccionado" />
        )}
      </Card>
    </Space>
  );

  const tabItems = [
    {
      key: "sales",
      label: (
        <span>
          <ShopOutlined /> Ventas
        </span>
      ),
      children: salesTab,
    },
    {
      key: "purchases",
      label: (
        <span>
          <ShoppingCartOutlined /> Compras
        </span>
      ),
      children: purchasesTab,
    },
  ];

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Encabezado con Filtros */}
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Space>
                <CalendarOutlined style={{ fontSize: "18px" }} />
                <span style={{ fontWeight: 500 }}>Período:</span>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) =>
                    setDateRange(dates as [Dayjs, Dayjs] | null)
                  }
                  format="DD/MM/YYYY"
                  presets={[
                    {
                      label: "Hoy",
                      value: [dayjs().startOf("day"), dayjs().endOf("day")],
                    },
                    {
                      label: "Esta Semana",
                      value: [dayjs().startOf("week"), dayjs().endOf("week")],
                    },
                    {
                      label: "Este Mes",
                      value: [dayjs().startOf("month"), dayjs().endOf("month")],
                    },
                    {
                      label: "Últimos 3 Meses",
                      value: [dayjs().subtract(3, "month"), dayjs()],
                    },
                    {
                      label: "Este Año",
                      value: [dayjs().startOf("year"), dayjs().endOf("year")],
                    },
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: "right" }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={salesLoading || purchasesLoading}
              >
                Actualizar
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Resumen General */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Card bordered={false}>
              <Statistic
                title="Total Ventas (Período)"
                value={salesData?.total_sales || 0}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: "#ef4444", fontSize: "24px" }}
                suffix={
                  <span style={{ fontSize: "14px", color: "#999" }}>
                    ({salesData?.total_items_sold || 0} unidades)
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card bordered={false}>
              <Statistic
                title="Total Compras (Período)"
                value={purchasesData?.total_purchases || 0}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: "#10b981", fontSize: "24px" }}
                suffix={
                  <span style={{ fontSize: "14px", color: "#999" }}>
                    ({purchasesData?.total_items_purchased || 0} unidades)
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>

        {/* Tabs con Reportes Detallados */}
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Tabs items={tabItems} />
        </Card>
      </Space>
    </>
  );
}

export default Reports;
