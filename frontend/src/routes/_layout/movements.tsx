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
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import dayjs from "dayjs";
import type {
  InventoryMovementPublic,
  InventoryMovementCreate,
} from "../../client/inventory";
import {
  InventoryMovementsService,
  MovementType,
} from "../../client/inventory";
import { ProductsService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const movementsSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 15;

export const Route = createFileRoute("/_layout/movements")({
  component: Movements,
  validateSearch: (search) => movementsSearchSchema.parse(search),
});

// Configuración de tipos de movimiento para el UI
const movementTypeConfig = {
  [MovementType.ENTRADA_COMPRA]: {
    color: "green",
    icon: <ArrowDownOutlined />,
    label: "Compra",
    group: "entrada",
  },
  [MovementType.DEVOLUCION_CLIENTE]: {
    color: "cyan",
    icon: <RollbackOutlined />,
    label: "Devolución Cliente",
    group: "entrada",
  },
  [MovementType.SALIDA_VENTA]: {
    color: "red",
    icon: <ArrowUpOutlined />,
    label: "Venta",
    group: "salida",
  },
  [MovementType.AJUSTE_CONTEO]: {
    color: "orange",
    icon: <SyncOutlined />,
    label: "Ajuste Conteo",
    group: "ajuste",
  },
  [MovementType.AJUSTE_MERMA]: {
    color: "volcano",
    icon: <ExclamationCircleOutlined />,
    label: "Merma",
    group: "ajuste",
  },
  [MovementType.DEVOLUCION_PROVEEDOR]: {
    color: "purple",
    icon: <RollbackOutlined />,
    label: "Devolución Proveedor",
    group: "ajuste",
  },
};

function Movements() {
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<MovementType | undefined>();
  const [form] = Form.useForm();
  const [selectedMovementType, setSelectedMovementType] = useState<
    MovementType | undefined
  >();

  // Query para movimientos
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ["inventory-movements", page, filterType],
    queryFn: () =>
      InventoryMovementsService.readInventoryMovements({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        movement_type: filterType,
      }),
  });

  // Query para productos
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => ProductsService.readProducts({ skip: 0, limit: 1000 }),
  });

  // Mutación para crear movimiento
  const createMutation = useMutation({
    mutationFn: (data: InventoryMovementCreate) =>
      InventoryMovementsService.createInventoryMovement({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Movimiento registrado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      const message = error?.body?.detail || "Error al registrar el movimiento";
      showError(message);
    },
  });

  const handleOpenModal = () => {
    form.resetFields();
    setSelectedMovementType(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
    setSelectedMovementType(undefined);
  };

  const handleSubmit = async (values: any) => {
    const movement: InventoryMovementCreate = {
      product_id: values.product_id,
      movement_type: values.movement_type,
      quantity: values.quantity,
      reference_number: values.reference_number || null,
      notes: values.notes || null,
      unit_price: values.unit_price || null,
      movement_date: values.movement_date
        ? dayjs(values.movement_date).toISOString()
        : null,
    };
    createMutation.mutate(movement);
  };

  // Filtrar movimientos por tipo
  const filteredData = movementsData?.data;

  // Crear un mapa de productos para lookup rápido
  const productsMap = new Map(
    productsData?.data.map((prod) => [prod.id, prod]) || []
  );

  const columns = [
    {
      title: "Fecha",
      dataIndex: "movement_date",
      key: "date",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a: InventoryMovementPublic, b: InventoryMovementPublic) =>
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
          <Tag color={config?.color} icon={config?.icon}>
            {config?.label || type}
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
        return product?.name || "Producto no encontrado";
      },
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (qty: number, record: InventoryMovementPublic) => {
        const config = movementTypeConfig[record.movement_type];
        const isNegative = config?.group === "salida";
        return (
          <span
            style={{
              color: isNegative ? "#ef4444" : "#10b981",
              fontWeight: 500,
            }}
          >
            {isNegative ? "-" : "+"}
            {Math.abs(qty)}
          </span>
        );
      },
    },
    {
      title: "Referencia",
      dataIndex: "reference_number",
      key: "reference",
      width: 120,
      ellipsis: true,
      render: (ref: string | null) =>
        ref || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "Stock",
      key: "stock",
      width: 120,
      render: (_: any, record: InventoryMovementPublic) => (
        <span style={{ fontSize: "12px", color: "#666" }}>
          {record.stock_before} → {record.stock_after}
        </span>
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
    total: movementsData?.count || 0,
    entradas:
      movementsData?.data.filter((m) =>
        [MovementType.ENTRADA_COMPRA, MovementType.DEVOLUCION_CLIENTE].includes(
          m.movement_type
        )
      ).length || 0,
    salidas:
      movementsData?.data.filter(
        (m) => m.movement_type === MovementType.SALIDA_VENTA
      ).length || 0,
    ajustes:
      movementsData?.data.filter((m) =>
        [
          MovementType.AJUSTE_CONTEO,
          MovementType.AJUSTE_MERMA,
          MovementType.DEVOLUCION_PROVEEDOR,
        ].includes(m.movement_type)
      ).length || 0,
  };

  // Determinar si se requieren campos adicionales según el tipo de movimiento
  const requiresReferenceNumber =
    selectedMovementType === MovementType.ENTRADA_COMPRA ||
    selectedMovementType === MovementType.SALIDA_VENTA;

  const requiresNotes =
    selectedMovementType === MovementType.AJUSTE_CONTEO ||
    selectedMovementType === MovementType.AJUSTE_MERMA;

  const requiresUnitPrice =
    selectedMovementType === MovementType.ENTRADA_COMPRA;

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
                prefix={<SyncOutlined />}
                valueStyle={{ color: "#f59e0b" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla */}
        <Card
          title="Historial de Movimientos"
          extra={
            <Space>
              <Select
                placeholder="Filtrar por tipo"
                allowClear
                style={{ width: 200 }}
                onChange={setFilterType}
                value={filterType}
              >
                <Select.OptGroup label="Entradas">
                  <Select.Option value={MovementType.ENTRADA_COMPRA}>
                    Compra
                  </Select.Option>
                  <Select.Option value={MovementType.DEVOLUCION_CLIENTE}>
                    Devolución Cliente
                  </Select.Option>
                </Select.OptGroup>
                <Select.OptGroup label="Salidas">
                  <Select.Option value={MovementType.SALIDA_VENTA}>
                    Venta
                  </Select.Option>
                </Select.OptGroup>
                <Select.OptGroup label="Ajustes">
                  <Select.Option value={MovementType.AJUSTE_CONTEO}>
                    Ajuste Conteo
                  </Select.Option>
                  <Select.Option value={MovementType.AJUSTE_MERMA}>
                    Merma
                  </Select.Option>
                  <Select.Option value={MovementType.DEVOLUCION_PROVEEDOR}>
                    Devolución Proveedor
                  </Select.Option>
                </Select.OptGroup>
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenModal}
              >
                Nuevo Movimiento
              </Button>
            </Space>
          }
          bordered={false}
          style={{ borderRadius: 12 }}
        >
          <Table
            columns={columns}
            dataSource={filteredData || []}
            rowKey="id"
            loading={isLoading}
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
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>

      {/* Modal para crear movimiento */}
      <Modal
        title="Registrar Movimiento de Inventario"
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
          initialValues={{
            movement_type: MovementType.ENTRADA_COMPRA,
          }}
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
                label: `${prod.sku} - ${prod.name}`,
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
                <Select
                  onChange={(value) =>
                    setSelectedMovementType(value as MovementType)
                  }
                >
                  <Select.OptGroup label="Entradas">
                    <Select.Option value={MovementType.ENTRADA_COMPRA}>
                      Compra
                    </Select.Option>
                    <Select.Option value={MovementType.DEVOLUCION_CLIENTE}>
                      Devolución Cliente
                    </Select.Option>
                  </Select.OptGroup>
                  <Select.OptGroup label="Salidas">
                    <Select.Option value={MovementType.SALIDA_VENTA}>
                      Venta
                    </Select.Option>
                  </Select.OptGroup>
                  <Select.OptGroup label="Ajustes">
                    <Select.Option value={MovementType.AJUSTE_CONTEO}>
                      Ajuste Conteo
                    </Select.Option>
                    <Select.Option value={MovementType.AJUSTE_MERMA}>
                      Merma
                    </Select.Option>
                    <Select.Option value={MovementType.DEVOLUCION_PROVEEDOR}>
                      Devolución Proveedor
                    </Select.Option>
                  </Select.OptGroup>
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
              <Form.Item
                name="reference_number"
                label="Número de Referencia"
                rules={[
                  {
                    required: requiresReferenceNumber,
                    message: "Requerido para compras y ventas",
                  },
                  { max: 100, message: "Máximo 100 caracteres" },
                ]}
              >
                <Input placeholder="Ej: Factura #123" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="movement_date" label="Fecha del Movimiento">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Fecha y hora"
                />
              </Form.Item>
            </Col>
          </Row>

          {requiresUnitPrice && (
            <Form.Item
              name="unit_price"
              label="Precio Unitario de Compra"
              rules={[
                {
                  required: true,
                  message: "Requerido para compras",
                },
                {
                  type: "number",
                  min: 0.01,
                  message: "Debe ser mayor a 0",
                },
              ]}
            >
              <InputNumber
                prefix="$"
                style={{ width: "100%" }}
                min={0.01}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
          )}

          <Form.Item
            name="notes"
            label="Notas"
            rules={[
              {
                required: requiresNotes,
                message: "Las notas son requeridas para ajustes",
              },
              { max: 500, message: "Máximo 500 caracteres" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder={
                requiresNotes
                  ? "Explica el motivo del ajuste..."
                  : "Notas adicionales (opcional)"
              }
              showCount
              maxLength={500}
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
