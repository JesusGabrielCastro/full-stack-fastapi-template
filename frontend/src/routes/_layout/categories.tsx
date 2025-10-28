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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  AppstoreOutlined,
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
  const [form] = Form.useForm();

  // Query para categorías
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories", page],
    queryFn: () =>
      CategoriesService.readCategories({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
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
    onError: () => {
      showError("Error al crear la categoría");
    },
  });

  // Mutación para actualizar categoría - CORREGIDO: usa 'id' no 'categoryId'
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      CategoriesService.updateCategory({ id, requestBody: data }),
    onSuccess: () => {
      showSuccess("Categoría actualizada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleCloseModal();
    },
    onError: () => {
      showError("Error al actualizar la categoría");
    },
  });

  // Mutación para eliminar categoría - CORREGIDO: usa 'id' no 'categoryId'
  const deleteMutation = useMutation({
    mutationFn: (id: string) => CategoriesService.deleteCategory({ id }),
    onSuccess: () => {
      showSuccess("Categoría eliminada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => {
      showError("Error al eliminar la categoría");
    },
  });

  const handleOpenModal = (category?: CategoryPublic) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue(category);
    } else {
      setEditingCategory(null);
      form.resetFields();
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

  // Filtrar categorías localmente
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

  const totalCategories = categoriesData?.count || 0;

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Estadísticas */}
        <Row gutter={16}>
          <Col span={24}>
            <Card bordered={false}>
              <Statistic
                title="Total de Categorías"
                value={totalCategories}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla */}
        <Card
          title="Gestión de Categorías"
          extra={
            <Space>
              <Search
                placeholder="Buscar categorías..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
              >
                Nueva Categoría
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
              total: totalCategories,
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
