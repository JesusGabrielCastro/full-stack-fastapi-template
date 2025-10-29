import {
  Modal,
  Table,
  Tag,
  Space,
  Empty,
  Statistic,
  Row,
  Col,
  Card,
  DatePicker,
  Button,
  Spin,
  theme,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  EditOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import type { MovementPublic, MovementType, ProductPublic } from "../client";
import { KardexService } from "../client";

const { RangePicker } = DatePicker;

interface KardexModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductPublic | null;
}

export function KardexModal({ open, onClose, product }: KardexModalProps) {
  const { token } = theme.useToken();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const {
    data: kardexData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["kardex", product?.id, dateRange],
    queryFn: () =>
      KardexService.getProductKardex({
        productId: product!.id,
        start_date: dateRange?.[0].toISOString(),
        end_date: dateRange?.[1].toISOString(),
        skip: 0,
        limit: 100,
      }),
    enabled: !!product && open,
  });

  const movementTypeConfig: Record<
    MovementType,
    { color: string; label: string; icon: JSX.Element }
  > = {
    ENTRADA_COMPRA: {
      color: "green",
      icon: <ShoppingCartOutlined />,
      label: "Entrada Compra",
    },
    SALIDA_VENTA: {
      color: "red",
      icon: <ShopOutlined />,
      label: "Salida Venta",
    },
    AJUSTE_CONTEO: {
      color: "blue",
      icon: <EditOutlined />,
      label: "Ajuste Conteo",
    },
    AJUSTE_MERMA: {
      color: "orange",
      icon: <EditOutlined />,
      label: "Ajuste Merma",
    },
    DEVOLUCION_CLIENTE: {
      color: "cyan",
      icon: <ArrowDownOutlined />,
      label: "Devolución Cliente",
    },
    DEVOLUCION_PROVEEDOR: {
      color: "purple",
      icon: <ArrowUpOutlined />,
      label: "Devolución Proveedor",
    },
  };

  const columns = [
    {
      title: "Fecha",
      dataIndex: "movement_date",
      key: "date",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a: MovementPublic, b: MovementPublic) =>
        new Date(a.movement_date).getTime() -
        new Date(b.movement_date).getTime(),
    },
    {
      title: "Tipo",
      dataIndex: "movement_type",
      key: "type",
      width: 180,
      render: (type: MovementType) => {
        const config = movementTypeConfig[type];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center" as const,
      render: (qty: number, record: MovementPublic) => {
        const isNegative =
          record.movement_type.includes("SALIDA") ||
          record.movement_type.includes("DEVOLUCION_PROVEEDOR") ||
          record.movement_type.includes("AJUSTE_MERMA");
        return (
          <span
            style={{
              color: isNegative ? token.colorError : token.colorSuccess,
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            {isNegative ? "-" : "+"}
            {qty}
          </span>
        );
      },
    },
    {
      title: "Stock Antes",
      dataIndex: "stock_before",
      key: "stock_before",
      width: 100,
      align: "center" as const,
    },
    {
      title: "Stock Después",
      dataIndex: "stock_after",
      key: "stock_after",
      width: 110,
      align: "center" as const,
      render: (stock: number) => (
        <span style={{ fontWeight: 500 }}>{stock}</span>
      ),
    },
    {
      title: "Precio Unit.",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 110,
      align: "right" as const,
      render: (price: string | null) =>
        price ? `$${parseFloat(price).toFixed(2)}` : "-",
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 110,
      align: "right" as const,
      render: (total: string | null) =>
        total ? (
          <span style={{ fontWeight: 600 }}>
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
      width: 120,
      render: (ref: string | null) => ref || "-",
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string | null) => notes || "-",
    },
  ];

  const getStockStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "out_of_stock":
        return token.colorError;
      case "low_stock":
        return token.colorWarning;
      case "in_stock":
        return token.colorSuccess;
      default:
        return token.colorPrimary;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <span>Kardex - Trazabilidad del Producto</span>
          {product && (
            <Tag color="blue">
              {product.sku} - {product.name}
            </Tag>
          )}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="95%"
      style={{ top: 20, maxWidth: 1400 }}
    >
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: token.colorTextSecondary }}>
            Cargando historial de movimientos...
          </div>
        </div>
      ) : kardexData ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Información del Producto */}
          <Card
            bordered={false}
            style={{ backgroundColor: token.colorBgLayout }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: token.colorTextSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Nombre del Producto
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: token.colorText,
                    }}
                  >
                    {kardexData.product.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: token.colorTextTertiary,
                      marginTop: 2,
                    }}
                  >
                    SKU: {kardexData.product.sku}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={4}>
                <Statistic
                  title="Stock Actual"
                  value={kardexData.current_stock}
                  valueStyle={{
                    color: getStockStatusColor(kardexData.stock_status),
                    fontSize: 24,
                  }}
                />
              </Col>
              <Col xs={24} sm={4}>
                <Statistic
                  title="Stock Mínimo"
                  value={kardexData.product.min_stock}
                  valueStyle={{ fontSize: 24 }}
                />
              </Col>
              <Col xs={24} sm={4}>
                <Statistic
                  title="Total Movimientos"
                  value={kardexData.total_movements}
                  valueStyle={{
                    fontSize: 24,
                    color: token.colorPrimary,
                  }}
                />
              </Col>
              <Col xs={24} sm={4}>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: token.colorTextSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Estado
                  </div>
                  <Tag
                    color={getStockStatusColor(kardexData.stock_status)}
                    style={{ marginTop: 8, fontSize: 14, padding: "4px 12px" }}
                  >
                    {kardexData.stock_status === "OUT_OF_STOCK"
                      ? "Sin Stock"
                      : kardexData.stock_status === "LOW_STOCK"
                        ? "Stock Bajo"
                        : "En Stock"}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Filtros */}
          <Card bordered={false}>
            <Row gutter={16} align="middle">
              <Col xs={24} md={12}>
                <Space>
                  <CalendarOutlined
                    style={{ fontSize: 18, color: token.colorPrimary }}
                  />
                  <span style={{ fontWeight: 500 }}>Filtrar por fecha:</span>
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) =>
                      setDateRange(dates as [Dayjs, Dayjs] | null)
                    }
                    format="DD/MM/YYYY"
                    placeholder={["Fecha inicio", "Fecha fin"]}
                    presets={[
                      {
                        label: "Últimos 7 días",
                        value: [dayjs().subtract(7, "day"), dayjs()],
                      },
                      {
                        label: "Últimos 30 días",
                        value: [dayjs().subtract(30, "day"), dayjs()],
                      },
                      {
                        label: "Este mes",
                        value: [
                          dayjs().startOf("month"),
                          dayjs().endOf("month"),
                        ],
                      },
                      {
                        label: "Mes anterior",
                        value: [
                          dayjs().subtract(1, "month").startOf("month"),
                          dayjs().subtract(1, "month").endOf("month"),
                        ],
                      },
                    ]}
                  />
                </Space>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                  loading={isLoading}
                >
                  Actualizar
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Tabla de Movimientos */}
          {kardexData.movements && kardexData.movements.length > 0 ? (
            <Table
              columns={columns}
              dataSource={kardexData.movements}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1200, y: 400 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} movimientos`,
              }}
              summary={(pageData) => {
                let totalEntries = 0;
                let totalExits = 0;

                pageData.forEach(({ movement_type, quantity }) => {
                  const isExit =
                    movement_type.includes("SALIDA") ||
                    movement_type.includes("DEVOLUCION_PROVEEDOR") ||
                    movement_type.includes("AJUSTE_MERMA");

                  if (isExit) {
                    totalExits += quantity;
                  } else {
                    totalEntries += quantity;
                  }
                });

                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row
                      style={{ backgroundColor: token.colorBgLayout }}
                    >
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <strong>Totales de la página:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="center">
                        <Space direction="vertical" size={0}>
                          <span
                            style={{
                              color: token.colorSuccess,
                              fontWeight: 600,
                            }}
                          >
                            +{totalEntries}
                          </span>
                          <span
                            style={{
                              color: token.colorError,
                              fontWeight: 600,
                            }}
                          >
                            -{totalExits}
                          </span>
                        </Space>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} colSpan={6} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          ) : (
            <Empty
              description="No hay movimientos para este producto en el período seleccionado"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Space>
      ) : (
        <Empty description="No se pudo cargar el kardex" />
      )}
    </Modal>
  );
}
