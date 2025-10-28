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
} from "antd";
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import dayjs from "dayjs";
import type { MovementPublic, MovementCreate } from "../../client";
import { MovementsService, ProductsService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const movementsSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 15;

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
  const [filterType, setFilterType] = useState<string | undefined>();
  const [form] = Form.useForm();

  // Query para movimientos
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ["movements", page],
    queryFn: () =>
      MovementsService.readMovements({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
  });

  // Query para productos
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => ProductsService.readProducts({ skip: 0, limit: 1000 }),
  });

  // Mutación para crear movimiento
  const createMutation = useMutation({
    mutationFn: (data: MovementCreate) =>
      MovementsService.createMovement({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Movimiento registrado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleCloseModal();
    },
    onError: () => {
      showError("Error al registrar el movimiento");
    },
  });

  const handleOpenModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values: MovementCreate) => {
    createMutation.mutate(values);
  };

  // Filtrar movimientos por tipo
  const filteredData = filterType
    ? movementsData?.data.filter((mov) => mov.movement_type === filterType)
    : movementsData?.data;

  // Crear un mapa de productos para lookup rápido
  const productsMap = new Map(
    productsData?.data.map((prod) => [prod.id, prod]) || []
  );

  const columns = [
    {
      title: "Fecha",
      dataIndex: "created_at",
      key: "date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a: MovementPublic, b: MovementPublic) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Tipo",
      dataIndex: "movement_type",
      key: "type",
      render: (type: string) => {
        const config = {
          entrada: {
            color: "green",
            icon: <ArrowDownOutlined />,
            label: "Entrada",
          },
          salida: { color: "red", icon: <ArrowUpOutlined />, label: "Salida" },
        };
        const { color, icon, label } = config[type as keyof typeof config] || {
          color: "default",
          icon: null,
          label: type,
        };
        return (
          <Tag color={color} icon={icon}>
            {label}
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
      render: (qty: number, record: MovementPublic) => {
        const isNegative = record.movement_type === "salida";
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
      movementsData?.data.filter((m) => m.movement_type === "entrada").length ||
      0,
    salidas:
      movementsData?.data.filter((m) => m.movement_type === "salida").length ||
      0,
  };

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Estadísticas */}
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Total Movimientos"
                value={stats.total}
                prefix={<SwapOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Entradas"
                value={stats.entradas}
                prefix={<ArrowDownOutlined />}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Salidas"
                value={stats.salidas}
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: "#ef4444" }}
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
                style={{ width: 150 }}
                onChange={setFilterType}
              >
                <Select.Option value="entrada">Entradas</Select.Option>
                <Select.Option value="salida">Salidas</Select.Option>
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
              total: filteredData?.length || 0,
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
        title="Registrar Movimiento"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          initialValues={{
            movement_type: "entrada",
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
                label: prod.name,
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
                  <Select.Option value="entrada">Entrada</Select.Option>
                  <Select.Option value="salida">Salida</Select.Option>
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
