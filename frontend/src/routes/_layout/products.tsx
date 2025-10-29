import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Tag,
  Modal,
  Form,
  InputNumber,
  Select,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Switch,
  Segmented,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { ProductPublic, ProductCreate, ProductUpdate } from "../../client";
import { ProductsService, CategoriesService } from "../../client";
import { useNotification } from "../../hooks/useNotification";
import { KardexModal } from "../../components/Kardexmodal";

const { Search } = Input;

const productsSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 10;

type StatusFilter = "all" | "active" | "inactive";
type StockFilter = "all" | "low";

export const Route = createFileRoute("/_layout/products")({
  component: Products,
  validateSearch: (search) => productsSearchSchema.parse(search),
});

function Products() {
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductPublic | null>(
    null
  );
  const [kardexModalOpen, setKardexModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductPublic | null>(
    null
  );
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined
  );
  const [form] = Form.useForm();

  // Query para productos con filtros
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      "products",
      page,
      statusFilter,
      stockFilter,
      categoryFilter,
      searchText,
    ],
    queryFn: () =>
      ProductsService.readProducts({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        active_only:
          statusFilter === "all" ? undefined : statusFilter === "active",
        low_stock_only: stockFilter === "low",
        category_id: categoryFilter,
        search: searchText || undefined,
      }),
  });

  // Query para estadísticas (sin filtros)
  const { data: statsData } = useQuery({
    queryKey: ["products-stats"],
    queryFn: () =>
      ProductsService.readProducts({
        skip: 0,
        limit: 1000,
      }),
  });

  // Query para categorías activas
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-active"],
    queryFn: () =>
      CategoriesService.readCategories({
        skip: 0,
        limit: 100,
        active_only: true,
      }),
  });

  // Mutación para crear producto
  const createMutation = useMutation({
    mutationFn: (data: ProductCreate) =>
      ProductsService.createProduct({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Producto creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-stats"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error("Error al crear producto:", error);
      const errorMessage =
        error?.body?.detail || error?.message || "Error al crear el producto";

      // Si es un error de validación con múltiples campos
      if (Array.isArray(errorMessage)) {
        const errors = errorMessage.map((err: any) => err.msg).join(", ");
        showError(`Error de validación: ${errors}`);
      } else if (typeof errorMessage === "string") {
        showError(errorMessage);
      } else {
        showError("Error al crear el producto");
      }
    },
  });

  // Mutación para actualizar producto
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      ProductsService.updateProduct({ id, requestBody: data }),
    onSuccess: () => {
      showSuccess("Producto actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-stats"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error("Error al actualizar producto:", error);
      const errorMessage =
        error?.body?.detail ||
        error?.message ||
        "Error al actualizar el producto";

      // Si es un error de validación con múltiples campos
      if (Array.isArray(errorMessage)) {
        const errors = errorMessage.map((err: any) => err.msg).join(", ");
        showError(`Error de validación: ${errors}`);
      } else if (typeof errorMessage === "string") {
        showError(errorMessage);
      } else {
        showError("Error al actualizar el producto");
      }
    },
  });

  // Mutación para eliminar producto (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProductsService.deleteProduct({ id }),
    onSuccess: () => {
      showSuccess("Producto eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-stats"] });
    },
    onError: (error: any) => {
      console.error("Error al eliminar producto:", error);
      const errorMessage =
        error?.body?.detail ||
        error?.message ||
        "Error al eliminar el producto";

      if (typeof errorMessage === "string") {
        showError(errorMessage);
      } else {
        showError("Error al eliminar el producto");
      }
    },
  });

  const handleOpenModal = (product?: ProductPublic) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue({
        ...product,
        unit_price: parseFloat(product.unit_price),
        sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
      });
    } else {
      setEditingProduct(null);
      form.resetFields();
      form.setFieldsValue({ is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleOpenKardex = (product: ProductPublic) => {
    setSelectedProduct(product);
    setKardexModalOpen(true);
  };

  const handleCloseKardex = () => {
    setKardexModalOpen(false);
    setSelectedProduct(null);
  };

  // Crear un mapa de categorías para lookup rápido
  const categoriesMap = new Map(
    categoriesData?.data.map((cat) => [cat.id, cat.name]) || []
  );

  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 120,
      sorter: (a: ProductPublic, b: ProductPublic) =>
        a.sku.localeCompare(b.sku),
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      sorter: (a: ProductPublic, b: ProductPublic) =>
        a.name.localeCompare(b.name),
    },
    {
      title: "Categoría",
      dataIndex: "category_id",
      key: "category",
      width: 150,
      render: (categoryId: string | null) =>
        categoryId && categoriesMap.has(categoryId) ? (
          <Tag color="blue">{categoriesMap.get(categoryId)}</Tag>
        ) : (
          <Tag>Sin categoría</Tag>
        ),
    },
    {
      title: "Precio Unitario",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 120,
      render: (price: string) => `$${parseFloat(price).toFixed(2)}`,
      sorter: (a: ProductPublic, b: ProductPublic) =>
        parseFloat(a.unit_price) - parseFloat(b.unit_price),
    },
    {
      title: "Precio Venta",
      dataIndex: "sale_price",
      key: "sale_price",
      width: 120,
      render: (price: string | null) =>
        price ? (
          `$${parseFloat(price).toFixed(2)}`
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
    },
    {
      title: "Stock Actual",
      dataIndex: "current_stock",
      key: "current_stock",
      width: 120,
      render: (stock: number, record: ProductPublic) => (
        <Tag
          color={
            stock === 0 ? "red" : stock <= record.min_stock ? "orange" : "green"
          }
        >
          {stock} {record.unit_of_measure}
        </Tag>
      ),
      sorter: (a: ProductPublic, b: ProductPublic) =>
        a.current_stock - b.current_stock,
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Activo" : "Inactivo"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: ProductPublic) => (
        <Space>
          <Tooltip title="Ver Kardex">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => handleOpenKardex(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar producto?"
            description="Se desactivará el producto (no se elimina permanentemente)"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calcular estadísticas
  const totalProducts = statsData?.count || 0;
  const activeProducts = statsData?.data.filter((p) => p.is_active).length || 0;
  const totalValue =
    statsData?.data.reduce(
      (sum, product) =>
        sum + product.current_stock * parseFloat(product.unit_price),
      0
    ) || 0;
  const lowStock =
    statsData?.data.filter((p) => p.is_active && p.current_stock <= p.min_stock)
      .length || 0;

  // Opciones de filtros
  const statusOptions = [
    { label: "Todos", value: "all", icon: <InboxOutlined /> },
    { label: "Activos", value: "active", icon: <CheckCircleOutlined /> },
    { label: "Inactivos", value: "inactive", icon: <CloseCircleOutlined /> },
  ];

  const stockOptions = [
    { label: "Todos", value: "all" },
    { label: "Stock Bajo", value: "low" },
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
                title="Total de Productos"
                value={totalProducts}
                prefix={<InboxOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Productos Activos"
                value={activeProducts}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Valor Total Inventario"
                value={totalValue}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: "#f59e0b" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Productos Bajo Stock"
                value={lowStock}
                prefix={<WarningOutlined />}
                valueStyle={{ color: "#ef4444" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla */}
        <Card
          title="Gestión de Productos"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Nuevo Producto
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
                <Search
                  placeholder="Buscar por SKU o nombre..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined />}
                  style={{ width: "100%" }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  placeholder="Filtrar por categoría"
                  allowClear
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value)}
                  style={{ width: "100%" }}
                  options={[
                    { label: "Todas las categorías", value: undefined },
                    ...(categoriesData?.data.map((cat) => ({
                      label: cat.name,
                      value: cat.id,
                    })) || []),
                  ]}
                />
              </Col>
              <Col xs={24} md={8}>
                <Space wrap>
                  <span style={{ color: "#666" }}>Estado:</span>
                  <Segmented
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as StatusFilter)}
                  />
                </Space>
              </Col>
            </Row>
            <Row>
              <Col>
                <Space>
                  <span style={{ color: "#666" }}>Stock:</span>
                  <Segmented
                    options={stockOptions}
                    value={stockFilter}
                    onChange={(value) => setStockFilter(value as StockFilter)}
                  />
                </Space>
              </Col>
            </Row>
          </Space>

          <Table
            columns={columns}
            dataSource={productsData?.data || []}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1200 }}
            pagination={{
              current: page,
              pageSize: PER_PAGE,
              total: productsData?.count || 0,
              onChange: (newPage) =>
                navigate({
                  search: (prev: any) => ({ ...prev, page: newPage }),
                }),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} productos`,
            }}
          />
        </Card>
      </Space>

      {/* Modal para crear/editar */}
      <Modal
        title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[
                  { required: true, message: "El SKU es requerido" },
                  { max: 50, message: "Máximo 50 caracteres" },
                ]}
              >
                <Input placeholder="SKU del producto" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Nombre"
                rules={[
                  { required: true, message: "El nombre es requerido" },
                  { max: 255, message: "Máximo 255 caracteres" },
                ]}
              >
                <Input placeholder="Nombre del producto" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} placeholder="Descripción del producto" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category_id" label="Categoría">
                <Select
                  placeholder="Selecciona una categoría"
                  allowClear
                  options={categoriesData?.data.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit_of_measure"
                label="Unidad de Medida"
                rules={[
                  {
                    required: true,
                    message: "La unidad de medida es requerida",
                  },
                ]}
              >
                <Select placeholder="Selecciona unidad">
                  <Select.Option value="unidad">Unidad</Select.Option>
                  <Select.Option value="kg">Kilogramo</Select.Option>
                  <Select.Option value="g">Gramo</Select.Option>
                  <Select.Option value="l">Litro</Select.Option>
                  <Select.Option value="ml">Mililitro</Select.Option>
                  <Select.Option value="m">Metro</Select.Option>
                  <Select.Option value="cm">Centímetro</Select.Option>
                  <Select.Option value="caja">Caja</Select.Option>
                  <Select.Option value="paquete">Paquete</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="unit_price"
                label="Precio Unitario"
                rules={[
                  { required: true, message: "El precio es requerido" },
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
            <Col span={8}>
              <Form.Item
                name="sale_price"
                label="Precio de Venta"
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
            <Col span={8}>
              <Form.Item
                name="min_stock"
                label="Stock Mínimo"
                rules={[
                  { required: true, message: "El stock mínimo es requerido" },
                  {
                    type: "number",
                    min: 0,
                    message: "El stock debe ser mayor o igual a 0",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_active"
            label="Estado"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingProduct ? "Actualizar" : "Crear"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Kardex */}
      <KardexModal
        open={kardexModalOpen}
        onClose={handleCloseKardex}
        product={selectedProduct}
      />
    </>
  );
}

export default Products;
