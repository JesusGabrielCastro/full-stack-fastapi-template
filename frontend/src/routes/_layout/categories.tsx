import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Switch,
  Tag,
  Segmented,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type {
  CategoryPublic,
  CategoryCreate,
  CategoryUpdate,
} from "../../client";
import { CategoriesService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const { Search } = Input;

const categoriesSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 10;

type StatusFilter = "all" | "active" | "inactive";

export const Route = createFileRoute("/_layout/categories")({
  component: Categories,
  validateSearch: (search) => categoriesSearchSchema.parse(search),
});

function Categories() {
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryPublic | null>(
    null
  );
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [form] = Form.useForm();

  // Query para categorías con filtro
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories", page, statusFilter],
    queryFn: () =>
      CategoriesService.readCategories({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        active_only:
          statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  });

  // Query para estadísticas (sin filtro de paginación ni estado)
  const { data: statsData } = useQuery({
    queryKey: ["categories-stats"],
    queryFn: () =>
      CategoriesService.readCategories({
        skip: 0,
        limit: 1000, // Límite alto para obtener todas
      }),
  });

  // Mutación para crear categoría
  const createMutation = useMutation({
    mutationFn: (data: CategoryCreate) =>
      CategoriesService.createCategory({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Categoría creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error("Error al crear categoría:", error);
      const errorMessage =
        error?.body?.detail || error?.message || "Error al crear la categoría";

      // Si es un error de validación con múltiples campos
      if (Array.isArray(errorMessage)) {
        const errors = errorMessage.map((err: any) => err.msg).join(", ");
        showError(`Error de validación: ${errors}`);
      } else if (typeof errorMessage === "string") {
        showError(errorMessage);
      } else {
        showError("Error al crear la categoría");
      }
    },
  });

  // Mutación para actualizar categoría
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      CategoriesService.updateCategory({ id, requestBody: data }),
    onSuccess: () => {
      showSuccess("Categoría actualizada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error("Error al actualizar categoría:", error);
      const errorMessage =
        error?.body?.detail ||
        error?.message ||
        "Error al actualizar la categoría";

      // Si es un error de validación con múltiples campos
      if (Array.isArray(errorMessage)) {
        const errors = errorMessage.map((err: any) => err.msg).join(", ");
        showError(`Error de validación: ${errors}`);
      } else if (typeof errorMessage === "string") {
        showError(errorMessage);
      } else {
        showError("Error al actualizar la categoría");
      }
    },
  });

  // Mutación para eliminar categoría
  const deleteMutation = useMutation({
    mutationFn: (id: string) => CategoriesService.deleteCategory({ id }),
    onSuccess: () => {
      showSuccess("Categoría eliminada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      console.error("Error al eliminar categoría:", error);
      const errorMessage =
        error?.body?.detail ||
        error?.message ||
        "Error al eliminar la categoría";

      if (typeof errorMessage === "string") {
        showError(errorMessage);
      } else {
        showError("Error al eliminar la categoría");
      }
    },
  });

  const handleOpenModal = (category?: CategoryPublic) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        ...category,
        is_active: category.is_active ?? true, // Valor por defecto true si no existe
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
      form.setFieldsValue({ is_active: true }); // Valor por defecto para crear
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Filtrar categorías solo por búsqueda (el estado se filtra en el backend)
  const filteredData = categoriesData?.data.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchText.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      sorter: (a: CategoryPublic, b: CategoryPublic) =>
        a.name.localeCompare(b.name),
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (desc: string | null) =>
        desc || <span style={{ color: "#999" }}>Sin descripción</span>,
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (isActive: boolean = true) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Activa" : "Inactiva"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 150,
      render: (_: any, record: CategoryPublic) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar categoría?"
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

  const totalCategories = statsData?.count || 0;
  const activeCategories =
    statsData?.data.filter((cat) => cat.is_active ?? true).length || 0;
  const inactiveCategories = totalCategories - activeCategories;

  // Opciones del filtro de estado
  const statusOptions = [
    {
      label: "Todas",
      value: "all",
      icon: <AppstoreOutlined />,
    },
    {
      label: "Activas",
      value: "active",
      icon: <CheckCircleOutlined />,
    },
    {
      label: "Inactivas",
      value: "inactive",
      icon: <CloseCircleOutlined />,
    },
  ];

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Estadísticas */}
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Total de Categorías"
                value={totalCategories}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Categorías Activas"
                value={activeCategories}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Categorías Inactivas"
                value={inactiveCategories}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "#ef4444" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla */}
        <Card
          title="Gestión de Categorías"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Nueva Categoría
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
            <Row gutter={16} align="middle">
              <Col xs={24} md={12} lg={8}>
                <Search
                  placeholder="Buscar categorías..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined />}
                  style={{ width: "100%" }}
                />
              </Col>
              <Col xs={24} md={12} lg={16}>
                <Space>
                  <span style={{ color: "#666" }}>Filtrar por estado:</span>
                  <Segmented
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as StatusFilter)}
                  />
                </Space>
              </Col>
            </Row>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredData || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: PER_PAGE,
              total: categoriesData?.count || 0,
              onChange: (newPage) =>
                navigate({
                  search: (prev: any) => ({ ...prev, page: newPage }),
                }),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} categorías`,
            }}
          />
        </Card>
      </Space>

      {/* Modal para crear/editar */}
      <Modal
        title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
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
        >
          <Form.Item
            name="name"
            label="Nombre"
            rules={[
              { required: true, message: "El nombre es requerido" },
              { max: 255, message: "Máximo 255 caracteres" },
            ]}
          >
            <Input placeholder="Nombre de la categoría" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[{ max: 500, message: "Máximo 500 caracteres" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Descripción de la categoría"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Estado"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="Activa"
              unCheckedChildren="Inactiva"
              defaultChecked
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? "Actualizar" : "Crear"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Categories;
