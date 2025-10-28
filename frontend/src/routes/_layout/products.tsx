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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { ProductPublic, ProductCreate, ProductUpdate } from "../../client";
import { ProductsService, CategoriesService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const { Search } = Input;

const productsSearchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().optional(),
});

const PER_PAGE = 10;

export const Route = createFileRoute("/_layout/products")({
  component: Products,
  validateSearch: (search) => productsSearchSchema.parse(search),
});

function Products() {
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();
  const { page = 1, search = "" } = Route.useSearch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductPublic | null>(
    null
  );
  const [searchText, setSearchText] = useState(search);
  const [form] = Form.useForm();

  // Query para productos
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", page, search],
    queryFn: () =>
      ProductsService.readProducts({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
  });

  // Query para categorías
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesService.readCategories({ skip: 0, limit: 100 }),
  });

  // Mutación para crear producto
  const createMutation = useMutation({
    mutationFn: (data: ProductCreate) =>
      ProductsService.createProduct({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Producto creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleCloseModal();
    },
    onError: () => {
      showError("Error al crear el producto");
    },
  });

  // Mutación para actualizar producto - CORREGIDO: usa 'id' no 'productId'
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      ProductsService.updateProduct({ id, requestBody: data }),
    onSuccess: () => {
      showSuccess("Producto actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleCloseModal();
    },
    onError: () => {
      showError("Error al actualizar el producto");
    },
  });

  // Mutación para eliminar producto - CORREGIDO: usa 'id' no 'productId'
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProductsService.deleteProduct({ id }),
    onSuccess: () => {
      showSuccess("Producto eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => {
      showError("Error al eliminar el producto");
    },
  });

  const handleOpenModal = (product?: ProductPublic) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue(product);
    } else {
      setEditingProduct(null);
      form.resetFields();
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

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Filtrar productos localmente
  const filteredData = productsData?.data.filter(
    (product) =>
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchText.toLowerCase())
  );

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
      render: (categoryId: string | null) =>
        categoryId && categoriesMap.has(categoryId) ? (
          <Tag color="blue">{categoriesMap.get(categoryId)}</Tag>
        ) : (
          <Tag>Sin categoría</Tag>
        ),
    },
    {
      title: "Precio Venta",
      dataIndex: "sale_price",
      key: "sale_price",
      render: (price: number) => `$${Number(price).toFixed(2)}`,
      sorter: (a: ProductPublic, b: ProductPublic) => Number(a.sale_price) - Number(b.sale_price),
    },
    {
      title: "Stock",
      dataIndex: "current_stock",
      key: "current_stock",
      render: (stock: number, record: ProductPublic) => (
        <Tag color={stock > record.min_stock ? "green" : stock > 0 ? "orange" : "red"}>
          {stock} {record.unit_of_measure}
        </Tag>
      ),
      sorter: (a: ProductPublic, b: ProductPublic) => a.current_stock - b.current_stock,
    },
    {
      title: "Acciones",
      key: "actions",
      width: 150,
      render: (_: any, record: ProductPublic) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar producto?"
            description="Esta acción no se puede deshacer"
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
  const totalProducts = productsData?.count || 0;
  const totalValue =
    productsData?.data.reduce(
      (sum, product) => sum + product.current_stock * Number(product.sale_price),
      0
    ) || 0;
  const lowStock = productsData?.data.filter((p) => p.current_stock <= p.min_stock).length || 0;

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Estadísticas */}
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Total de Productos"
                value={totalProducts}
                prefix={<InboxOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Valor Total Inventario"
                value={totalValue}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Productos Bajo Stock"
                value={lowStock}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: "#ef4444" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla */}
        <Card
          title="Gestión de Productos"
          extra={
            <Space>
              <Search
                placeholder="Buscar productos..."
                allowClear
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
              >
                Nuevo Producto
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
        width={700}
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
                label="SKU / Código"
                rules={[
                  { required: true, message: "El SKU es requerido" },
                  { max: 50, message: "Máximo 50 caracteres" },
                ]}
              >
                <Input placeholder="Código único del producto" />
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

          <Form.Item
            name="description"
            label="Descripción"
            rules={[{ max: 500, message: "Máximo 500 caracteres" }]}
          >
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
                  { required: true, message: "La unidad es requerida" },
                  { max: 50, message: "Máximo 50 caracteres" },
                ]}
              >
                <Select placeholder="Selecciona unidad">
                  <Select.Option value="unidad">Unidad</Select.Option>
                  <Select.Option value="kg">Kilogramo (kg)</Select.Option>
                  <Select.Option value="g">Gramo (g)</Select.Option>
                  <Select.Option value="litro">Litro</Select.Option>
                  <Select.Option value="ml">Mililitro (ml)</Select.Option>
                  <Select.Option value="caja">Caja</Select.Option>
                  <Select.Option value="paquete">Paquete</Select.Option>
                  <Select.Option value="metro">Metro</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit_price"
                label="Precio de Compra"
                rules={[
                  { required: true, message: "El precio de compra es requerido" },
                  {
                    type: "number",
                    min: 0.01,
                    message: "El precio debe ser mayor a 0",
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
            </Col>
            <Col span={12}>
              <Form.Item
                name="sale_price"
                label="Precio de Venta"
                rules={[
                  { required: true, message: "El precio de venta es requerido" },
                  {
                    type: "number",
                    min: 0.01,
                    message: "El precio debe ser mayor a 0",
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
            </Col>
          </Row>

          <Form.Item
            name="min_stock"
            label="Stock Mínimo (para alertas)"
            rules={[
              { required: true, message: "El stock mínimo es requerido" },
              {
                type: "number",
                min: 0,
                message: "El stock debe ser mayor o igual a 0",
              },
            ]}
            initialValue={0}
          >
            <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
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
    </>
  );
}

export default Products;
