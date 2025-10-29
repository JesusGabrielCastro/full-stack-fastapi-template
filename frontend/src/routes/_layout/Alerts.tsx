import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Segmented,
  Select,
  Modal,
  Form,
  Input,
  Empty,
  Tooltip,
} from "antd";
import {
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import dayjs from "dayjs";
import type { AlertPublic, AlertType } from "../../client";
import { AlertsService, ProductsService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const alertsSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 15;

type StatusFilter = "all" | "active" | "resolved";

export const Route = createFileRoute("/_layout/Alerts")({
  component: Alerts,
  validateSearch: (search) => alertsSearchSchema.parse(search),
});

function Alerts() {
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [typeFilter, setTypeFilter] = useState<AlertType | undefined>();
  const [productFilter, setProductFilter] = useState<string | undefined>();
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertPublic | null>(null);
  const [form] = Form.useForm();

  // Query para alertas con filtros
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ["alerts", page, statusFilter, typeFilter, productFilter],
    queryFn: () =>
      AlertsService.readAlerts({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        resolved:
          statusFilter === "all" ? undefined : statusFilter === "resolved",
        alert_type: typeFilter,
        product_id: productFilter,
      }),
  });

  // Query para productos
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () =>
      ProductsService.readProducts({
        skip: 0,
        limit: 1000,
      }),
  });

  // Query para estadísticas
  const { data: statsData } = useQuery({
    queryKey: ["alerts-stats"],
    queryFn: () =>
      AlertsService.readAlerts({
        skip: 0,
        limit: 1000,
      }),
  });

  // Mutación para resolver alerta
  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      AlertsService.resolveAlert({
        id,
        requestBody: {
          is_resolved: true,
          notes,
        },
      }),
    onSuccess: () => {
      showSuccess("Alerta resuelta exitosamente");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-stats"] });
      queryClient.invalidateQueries({ queryKey: ["active-alerts"] });
      setResolveModalOpen(false);
      setSelectedAlert(null);
      form.resetFields();
    },
    onError: (error: any) => {
      console.error("Error al resolver alerta:", error);
      const errorMessage =
        error?.body?.detail || error?.message || "Error al resolver la alerta";

      if (typeof errorMessage === "string") {
        showError(errorMessage);
      } else {
        showError("Error al resolver la alerta");
      }
    },
  });

  const handleResolve = (alert: AlertPublic) => {
    setSelectedAlert(alert);
    setResolveModalOpen(true);
  };

  const handleSubmitResolve = async (values: { notes?: string }) => {
    if (selectedAlert) {
      resolveMutation.mutate({
        id: selectedAlert.id,
        notes: values.notes,
      });
    }
  };

  // Crear mapa de productos
  const productsMap = new Map(
    productsData?.data.map((prod) => [prod.id, prod]) || []
  );

  const columns = [
    {
      title: "Producto",
      dataIndex: "product_id",
      key: "product",
      ellipsis: true,
      render: (productId: string) => {
        const product = productsMap.get(productId);
        return product ? (
          <div>
            <div style={{ fontWeight: 500 }}>{product.name}</div>
            <div style={{ fontSize: "12px", color: "#999" }}>
              SKU: {product.sku}
            </div>
          </div>
        ) : (
          "Producto no encontrado"
        );
      },
    },
    {
      title: "Tipo",
      dataIndex: "alert_type",
      key: "type",
      width: 150,
      render: (type: AlertType) => (
        <Tag color={type === "OUT_OF_STOCK" ? "red" : "orange"}>
          {type === "OUT_OF_STOCK" ? "Sin Stock" : "Stock Bajo"}
        </Tag>
      ),
    },
    {
      title: "Stock Actual",
      dataIndex: "current_stock",
      key: "current_stock",
      width: 120,
      render: (stock: number, record: AlertPublic) => (
        <span
          style={{
            color: stock === 0 ? "#ef4444" : "#f59e0b",
            fontWeight: 500,
          }}
        >
          {stock} / {record.min_stock}
        </span>
      ),
    },
    {
      title: "Fecha Creación",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("DD/MM/YYYY HH:mm:ss")}>
          <span>{dayjs(date).fromNow()}</span>
        </Tooltip>
      ),
      sorter: (a: AlertPublic, b: AlertPublic) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Estado",
      dataIndex: "is_resolved",
      key: "status",
      width: 120,
      render: (isResolved: boolean, record: AlertPublic) =>
        isResolved ? (
          <Tooltip
            title={`Resuelto ${record.resolved_at ? dayjs(record.resolved_at).format("DD/MM/YYYY HH:mm") : ""}`}
          >
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Resuelto
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="warning" icon={<ExclamationCircleOutlined />}>
            Activo
          </Tag>
        ),
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string | null) =>
        notes || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: AlertPublic) =>
        !record.is_resolved ? (
          <Button
            type="primary"
            size="small"
            onClick={() => handleResolve(record)}
          >
            Resolver
          </Button>
        ) : null,
    },
  ];

  // Calcular estadísticas
  const totalAlerts = statsData?.count || 0;
  const activeAlerts =
    statsData?.data.filter((a) => !a.is_resolved).length || 0;
  const resolvedAlerts =
    statsData?.data.filter((a) => a.is_resolved).length || 0;
  const outOfStock =
    statsData?.data.filter(
      (a) => !a.is_resolved && a.alert_type === "OUT_OF_STOCK"
    ).length || 0;

  // Opciones de filtros
  const statusOptions = [
    { label: "Activas", value: "active", icon: <WarningOutlined /> },
    { label: "Resueltas", value: "resolved", icon: <CheckCircleOutlined /> },
    { label: "Todas", value: "all", icon: <InboxOutlined /> },
  ];

  const typeOptions = [
    { label: "Todos los tipos", value: undefined },
    { label: "Sin Stock", value: "OUT_OF_STOCK" as AlertType },
    { label: "Stock Bajo", value: "LOW_STOCK" as AlertType },
  ];

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Estadísticas */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Total de Alertas"
                value={totalAlerts}
                prefix={<InboxOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Alertas Activas"
                value={activeAlerts}
                prefix={<WarningOutlined />}
                valueStyle={{ color: "#f59e0b" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Sin Stock"
                value={outOfStock}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "#ef4444" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Alertas Resueltas"
                value={resolvedAlerts}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla */}
        <Card
          title="Gestión de Alertas"
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["alerts"] })
              }
            >
              Actualizar
            </Button>
          }
          bordered={false}
          style={{ borderRadius: 12 }}
        >
          {/* Filtros superiores */}
          <Space
            direction="vertical"
            size="middle"
            style={{ width: "100%", marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Select
                  placeholder="Filtrar por producto"
                  allowClear
                  showSearch
                  value={productFilter}
                  onChange={(value) => setProductFilter(value)}
                  style={{ width: "100%" }}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(String(input).toLowerCase())
                  }
                  options={[
                    { label: "Todos los productos", value: undefined },
                    ...(productsData?.data.map((prod) => ({
                      label: `${prod.name} (${prod.sku})`,
                      value: prod.id,
                    })) || []),
                  ]}
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  placeholder="Filtrar por tipo"
                  allowClear
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value)}
                  style={{ width: "100%" }}
                  options={typeOptions}
                />
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <span style={{ color: "#666" }}>Estado:</span>
                  <Segmented
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as StatusFilter)}
                  />
                </Space>
              </Col>
            </Row>
          </Space>

          {alertsData && alertsData.data.length > 0 ? (
            <Table
              columns={columns}
              dataSource={alertsData.data}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1200 }}
              pagination={{
                current: page,
                pageSize: PER_PAGE,
                total: alertsData.count,
                onChange: (newPage) =>
                  navigate({
                    search: (prev: any) => ({ ...prev, page: newPage }),
                  }),
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} alertas`,
              }}
            />
          ) : (
            <Empty
              description="No hay alertas para mostrar"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </Space>

      {/* Modal para resolver alerta */}
      <Modal
        title="Resolver Alerta"
        open={resolveModalOpen}
        onCancel={() => {
          setResolveModalOpen(false);
          setSelectedAlert(null);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        {selectedAlert && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                Producto:{" "}
                {productsMap.get(selectedAlert.product_id)?.name ||
                  "Desconocido"}
              </div>
              <Space>
                <Tag
                  color={
                    selectedAlert.alert_type === "OUT_OF_STOCK"
                      ? "red"
                      : "orange"
                  }
                >
                  {selectedAlert.alert_type === "OUT_OF_STOCK"
                    ? "Sin Stock"
                    : "Stock Bajo"}
                </Tag>
                <span>
                  Stock: {selectedAlert.current_stock} / Mín:{" "}
                  {selectedAlert.min_stock}
                </span>
              </Space>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmitResolve}>
              <Form.Item name="notes" label="Notas (opcional)">
                <Input.TextArea
                  rows={3}
                  placeholder="Agrega notas sobre la resolución de esta alerta"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button
                    onClick={() => {
                      setResolveModalOpen(false);
                      setSelectedAlert(null);
                      form.resetFields();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={resolveMutation.isPending}
                  >
                    Resolver
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </>
  );
}

export default Alerts;
