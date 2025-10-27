import { useState } from "react";
import {
  Card,
  Button,
  Space,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tabs,
  Typography,
  Empty,
} from "antd";
import {
  DownloadOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import { ReportsService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export const Route = createFileRoute("/_layout/reports")({
  component: Reports,
});

function Reports() {
  const { contextHolder, showSuccess } = useNotification();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "days"),
    dayjs(),
  ]);

  // Query para reporte de ventas
  const { data: salesReport, isLoading: loadingSales } = useQuery({
    queryKey: ["sales-report", dateRange],
    queryFn: () =>
      ReportsService.getSalesReport({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
      }),
  });

  // Query para reporte de compras
  const { data: purchasesReport, isLoading: loadingPurchases } = useQuery({
    queryKey: ["purchases-report", dateRange],
    queryFn: () =>
      ReportsService.getPurchasesReport({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
      }),
  });

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handleExport = (type: "sales" | "purchases") => {
    // Aquí iría la lógica para exportar a PDF o Excel
    showSuccess(
      `Exportando reporte de ${type === "sales" ? "ventas" : "compras"}...`
    );
  };

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header con filtros */}
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                <FileTextOutlined /> Reportes e Informes
              </Title>
              <Text type="secondary">Análisis de ventas y compras</Text>
            </Col>
            <Col>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                presets={[
                  {
                    label: "Última semana",
                    value: [dayjs().subtract(7, "d"), dayjs()],
                  },
                  {
                    label: "Último mes",
                    value: [dayjs().subtract(1, "month"), dayjs()],
                  },
                  {
                    label: "Últimos 3 meses",
                    value: [dayjs().subtract(3, "month"), dayjs()],
                  },
                  {
                    label: "Este año",
                    value: [dayjs().startOf("year"), dayjs()],
                  },
                ]}
              />
            </Col>
          </Row>
        </Card>

        {/* Tabs para ventas y compras */}
        <Tabs
          defaultActiveKey="sales"
          items={[
            {
              key: "sales",
              label: (
                <span>
                  <ShoppingCartOutlined />
                  Reporte de Ventas
                </span>
              ),
              children: (
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  {/* Estadísticas de ventas */}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Card bordered={false} loading={loadingSales}>
                        <Statistic
                          title="Total Ventas"
                          value={salesReport?.total_sales || 0}
                          prefix={<DollarOutlined />}
                          precision={2}
                          valueStyle={{ color: "#10b981" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Card bordered={false} loading={loadingSales}>
                        <Statistic
                          title="Cantidad Total Vendida"
                          value={salesReport?.total_quantity || 0}
                          prefix={<ShoppingCartOutlined />}
                          valueStyle={{ color: "#6366f1" }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card
                    title="Resumen de Ventas"
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
                    style={{ borderRadius: 12 }}
                    loading={loadingSales}
                  >
                    {salesReport ? (
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Text>
                          <strong>Período:</strong>{" "}
                          {dateRange[0].format("DD/MM/YYYY")} -{" "}
                          {dateRange[1].format("DD/MM/YYYY")}
                        </Text>
                        <Text>
                          <strong>Total de ventas:</strong> $
                          {salesReport.total_sales.toFixed(2)}
                        </Text>
                        <Text>
                          <strong>Cantidad total vendida:</strong>{" "}
                          {salesReport.total_quantity} unidades
                        </Text>
                        {salesReport.total_quantity > 0 && (
                          <Text>
                            <strong>Precio promedio:</strong> $
                            {(
                              salesReport.total_sales /
                              salesReport.total_quantity
                            ).toFixed(2)}{" "}
                            por unidad
                          </Text>
                        )}
                      </Space>
                    ) : (
                      <Empty description="No hay datos disponibles" />
                    )}
                  </Card>
                </Space>
              ),
            },
            {
              key: "purchases",
              label: (
                <span>
                  <DollarOutlined />
                  Reporte de Compras
                </span>
              ),
              children: (
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  {/* Estadísticas de compras */}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Card bordered={false} loading={loadingPurchases}>
                        <Statistic
                          title="Total Compras"
                          value={purchasesReport?.total_purchases || 0}
                          prefix={<DollarOutlined />}
                          precision={2}
                          valueStyle={{ color: "#ef4444" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Card bordered={false} loading={loadingPurchases}>
                        <Statistic
                          title="Cantidad Total Comprada"
                          value={purchasesReport?.total_quantity || 0}
                          prefix={<ShoppingCartOutlined />}
                          valueStyle={{ color: "#6366f1" }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card
                    title="Resumen de Compras"
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
                    style={{ borderRadius: 12 }}
                    loading={loadingPurchases}
                  >
                    {purchasesReport ? (
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Text>
                          <strong>Período:</strong>{" "}
                          {dateRange[0].format("DD/MM/YYYY")} -{" "}
                          {dateRange[1].format("DD/MM/YYYY")}
                        </Text>
                        <Text>
                          <strong>Total de compras:</strong> $
                          {purchasesReport.total_purchases.toFixed(2)}
                        </Text>
                        <Text>
                          <strong>Cantidad total comprada:</strong>{" "}
                          {purchasesReport.total_quantity} unidades
                        </Text>
                        {purchasesReport.total_quantity > 0 && (
                          <Text>
                            <strong>Costo promedio:</strong> $
                            {(
                              purchasesReport.total_purchases /
                              purchasesReport.total_quantity
                            ).toFixed(2)}{" "}
                            por unidad
                          </Text>
                        )}
                      </Space>
                    ) : (
                      <Empty description="No hay datos disponibles" />
                    )}
                  </Card>
                </Space>
              ),
            },
          ]}
        />
      </Space>
    </>
  );
}

export default Reports;
