import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  Select,
  Row,
  Col,
  Statistic,
  Input,
  DatePicker,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import dayjs, { Dayjs } from "dayjs";
import type {
  MovementPublic,
  MovementCreate,
  MovementType,
} from "../../client";
import { MovementsService, ProductsService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const { RangePicker } = DatePicker;

const movementsSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 15;

type MovementAction = "entrada" | "salida" | "ajuste";

export const Route = createFileRoute("/_layout/movements")({
  component: Movements,
  validateSearch: (search) => movementsSearchSchema.parse(search),
});

function Movements() {
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementAction, setMovementAction] = useState<MovementAction | null>(
    null
  );
  const [filterType, setFilterType] = useState<MovementType | undefined>();
  const [filterProduct, setFilterProduct] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [form] = Form.useForm();

  // Query para movimientos con filtros
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ["movements", page, filterType, filterProduct, dateRange],
    queryFn: () =>
      MovementsService.readMovements({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        movement_type: filterType,
        product_id: filterProduct,
        start_date: dateRange?.[0].toISOString(),
        end_date: dateRange?.[1].toISOString(),
      }),
  });

  // Query para productos activos
  const { data: productsData } = useQuery({
    queryKey: ["products-active"],
    queryFn: () =>
      ProductsService.readProducts({
        skip: 0,
        limit: 1000,
        active_only: true,
      }),
  });

  // Query para estadísticas generales
  const { data: statsData } = useQuery({
    queryKey: ["movements-stats"],
    queryFn: () =>
      MovementsService.readMovements({
        skip: 0,
        limit: 1000,
      }),
  });

  // Mutación para crear movimiento
  const createMutation = useMutation({
    mutationFn: (data: MovementCreate) =>
      MovementsService.createMovement({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Movimiento registrado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-stats"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error("Error al registrar movimiento:", error);
      const errorMessage =
        error?.body?.detail ||
        error?.message ||
        "Error al registrar el movimiento";

      if (Array.isArray(errorMessage)) {
        const errors = errorMessage.map((err: any) => err.msg).join(", ");
        showError(`Error de validación: ${errors}`);
      } else if (typeof errorMessage === "string") {
        showError(errorMessage);
      } else {
        showError("Error al registrar el movimiento");
      }
    },
  });

  const handleOpenModal = (action: MovementAction) => {
    setMovementAction(action);
    form.resetFields();

    // Establecer el tipo de movimiento por defecto según la acción
    if (action === "entrada") {
      form.setFieldsValue({ movement_type: "ENTRADA_COMPRA" });
    } else if (action === "salida") {
      form.setFieldsValue({ movement_type: "SALIDA_VENTA" });
    } else if (action === "ajuste") {
      form.setFieldsValue({ movement_type: "AJUSTE_CONTEO" });
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMovementAction(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    const movementData: MovementCreate = {
      ...values,
      movement_date: values.movement_date
        ? dayjs(values.movement_date).toISOString()
        : undefined,
    };
    createMutation.mutate(movementData);
  };

  // Crear un mapa de productos para lookup rápido
  const productsMap = new Map(
    productsData?.data.map((prod) => [prod.id, prod]) || []
  );

  // Configuración de tipos de movimiento
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
      title: "Producto",
      dataIndex: "product_id",
      key: "product",
      ellipsis: true,
      render: (productId: string) => {
        const product = productsMap.get(productId);
        return product ? (
          <div>
            <div>{product.name}</div>
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
      title: "Referencia",
      dataIndex: "reference_number",
      key: "reference",
      width: 120,
      render: (ref: string | null) =>
        ref || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      render: (qty: number, record: MovementPublic) => {
        const isNegative =
          record.movement_type.includes("SALIDA") ||
          record.movement_type.includes("DEVOLUCION_PROVEEDOR") ||
          record.movement_type.includes("AJUSTE_MERMA");
        return (
          <span
            style={{
              color: isNegative ? "#ef4444" : "#10b981",
              fontWeight: 500,
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
    },
    {
      title: "Stock Después",
      dataIndex: "stock_after",
      key: "stock_after",
      width: 110,
    },
    {
      title: "Precio Unit.",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 110,
      render: (price: string | null) =>
        price ? (
          `$${parseFloat(price).toFixed(2)}`
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 110,
      render: (total: string | null) =>
        total ? (
          `$${parseFloat(total).toFixed(2)}`
        ) : (
          <span style={{ color: "#999" }}>-</span>
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
  ];

  // Calcular estadísticas
  const stats = {
    total: statsData?.count || 0,
    entradas:
      statsData?.data.filter((m) =>
        ["ENTRADA_COMPRA", "DEVOLUCION_CLIENTE"].includes(m.movement_type)
      ).length || 0,
    salidas:
      statsData?.data.filter((m) =>
        ["SALIDA_VENTA", "DEVOLUCION_PROVEEDOR"].includes(m.movement_type)
      ).length || 0,
    ajustes:
      statsData?.data.filter((m) =>
        ["AJUSTE_CONTEO", "AJUSTE_MERMA"].includes(m.movement_type)
      ).length || 0,
  };

  // Opciones de filtro de tipo
  const typeFilterOptions = [
    { label: "Todos", value: undefined },
    ...Object.entries(movementTypeConfig).map(([value, config]) => ({
      label: config.label,
      value: value as MovementType,
    })),
  ];

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Estadísticas */}
        <Row gutter={16}>
          <Col xs={24} sm={6}>
            <Card bordered={false}>
              <Statistic
                title="Total Movimientos"
                value={stats.total}
                prefix={<SwapOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card bordered={false}>
              <Statistic
                title="Entradas"
                value={stats.entradas}
                prefix={<ArrowDownOutlined />}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card bordered={false}>
              <Statistic
                title="Salidas"
                value={stats.salidas}
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: "#ef4444" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card bordered={false}>
              <Statistic
                title="Ajustes"
                value={stats.ajustes}
                prefix={<EditOutlined />}
                valueStyle={{ color: "#f59e0b" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla */}
        <Card
          title="Historial de Movimientos"
          extra={
            <Space wrap>
              <Button
                type="primary"
                icon={<ArrowDownOutlined />}
                onClick={() => handleOpenModal("entrada")}
                style={{ backgroundColor: "#10b981" }}
              >
                Entrada
              </Button>
              <Button
                type="primary"
                danger
                icon={<ArrowUpOutlined />}
                onClick={() => handleOpenModal("salida")}
              >
                Salida
              </Button>
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => handleOpenModal("ajuste")}
              >
                Ajuste
              </Button>
            </Space>
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
                  value={filterProduct}
                  onChange={(value) => setFilterProduct(value)}
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
                  value={filterType}
                  onChange={(value) => setFilterType(value)}
                  style={{ width: "100%" }}
                  options={typeFilterOptions}
                />
              </Col>
              <Col xs={24} md={8}>
                <RangePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder={["Fecha inicio", "Fecha fin"]}
                  value={dateRange}
                  onChange={(dates) =>
                    setDateRange(dates as [Dayjs, Dayjs] | null)
                  }
                />
              </Col>
            </Row>
          </Space>

          <Table
            columns={columns}
            dataSource={movementsData?.data || []}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize: PER_PAGE,
              total: movementsData?.count || 0,
              onChange: (newPage) =>
                navigate({
                  search: (prev: any) => ({ ...prev, page: newPage }),
                }),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} movimientos`,
            }}
          />
        </Card>
      </Space>

      {/* Modal para crear movimiento */}
      <Modal
        title={
          movementAction === "entrada"
            ? "Registrar Entrada"
            : movementAction === "salida"
              ? "Registrar Salida"
              : "Registrar Ajuste"
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="product_id"
            label="Producto"
            rules={[{ required: true, message: "Selecciona un producto" }]}
          >
            <Select
              showSearch
              placeholder="Buscar producto..."
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(String(input).toLowerCase())
              }
              options={productsData?.data.map((prod) => ({
                label: `${prod.name} (${prod.sku}) - Stock: ${prod.current_stock}`,
                value: prod.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="movement_type"
                label="Tipo de Movimiento"
                rules={[{ required: true, message: "Selecciona el tipo" }]}
              >
                <Select>
                  {movementAction === "entrada" && (
                    <>
                      <Select.Option value="ENTRADA_COMPRA">
                        Entrada por Compra
                      </Select.Option>
                      <Select.Option value="DEVOLUCION_CLIENTE">
                        Devolución de Cliente
                      </Select.Option>
                    </>
                  )}
                  {movementAction === "salida" && (
                    <>
                      <Select.Option value="SALIDA_VENTA">
                        Salida por Venta
                      </Select.Option>
                      <Select.Option value="DEVOLUCION_PROVEEDOR">
                        Devolución a Proveedor
                      </Select.Option>
                    </>
                  )}
                  {movementAction === "ajuste" && (
                    <>
                      <Select.Option value="AJUSTE_CONTEO">
                        Ajuste por Conteo
                      </Select.Option>
                      <Select.Option value="AJUSTE_MERMA">
                        Ajuste por Merma
                      </Select.Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Cantidad"
                rules={[
                  { required: true, message: "Ingresa la cantidad" },
                  { type: "number", min: 1, message: "Mínimo 1" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reference_number" label="Número de Referencia">
                <Input placeholder="Ej: FACTURA-001, GUIA-123" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit_price"
                label="Precio Unitario"
                rules={[
                  {
                    type: "number",
                    min: 0,
                    message: "El precio debe ser mayor a 0",
                  },
                ]}
              >
                <InputNumber
                  prefix="$"
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="movement_date" label="Fecha del Movimiento">
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Selecciona fecha"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notas">
            <Input.TextArea
              rows={3}
              placeholder="Notas adicionales (opcional)"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending}
              >
                Registrar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Movements;
