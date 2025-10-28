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
  Select,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Badge,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { UserPublic, UserCreate, UserUpdate } from "../../client/extended-types";
import { UsersService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const { Search } = Input;

const usersSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 10;

export const Route = createFileRoute("/_layout/users" as any)({
  component: Users,
  validateSearch: (search) => usersSearchSchema.parse(search),
});

function Users() {
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  // Query para el usuario actual
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => UsersService.readUserMe(),
  });

  // Query para usuarios
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: () =>
      UsersService.readUsers({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
  });

  // Mutación para crear usuario
  const createMutation = useMutation({
    mutationFn: (data: UserCreate) =>
      UsersService.createUser({ requestBody: data as any }),
    onSuccess: () => {
      showSuccess("Usuario creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseModal();
    },
    onError: () => {
      showError("Error al crear el usuario");
    },
  });

  // Mutación para actualizar usuario - CORREGIDO: usa 'userId' como string
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdate }) =>
      UsersService.updateUser({ userId, requestBody: data as any }),
    onSuccess: () => {
      showSuccess("Usuario actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseModal();
    },
    onError: () => {
      showError("Error al actualizar el usuario");
    },
  });

  // Mutación para eliminar usuario - CORREGIDO: usa 'userId' como string
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => UsersService.deleteUser({ userId }),
    onSuccess: () => {
      showSuccess("Usuario eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      showError("Error al eliminar el usuario");
    },
  });

  const handleOpenModal = (user?: UserPublic) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        ...user,
        password: undefined, // No mostrar contraseña en edición
      });
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    // Si no hay contraseña en edición, no la enviamos
    if (editingUser && !values.password) {
      delete values.password;
    }

    if (editingUser) {
      updateMutation.mutate({ userId: editingUser.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (userId: string) => {
    deleteMutation.mutate(userId);
  };

  // Filtrar usuarios localmente
  const filteredData = (usersData?.data.filter(
    (user) =>
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchText.toLowerCase())
  ) || []) as UserPublic[];

  const columns = [
    {
      title: "Nombre",
      dataIndex: "full_name",
      key: "full_name",
      render: (name: string | null, record: UserPublic) => (
        <Space>
          <span>{name || "Sin nombre"}</span>
          {currentUser?.id === record.id && (
            <Badge count="Tú" style={{ backgroundColor: "#6366f1" }} />
          )}
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        const roleConfig = {
          ADMINISTRADOR: { color: "purple", label: "Administrador" },
          VENDEDOR: { color: "blue", label: "Vendedor" },
          AUXILIAR: { color: "green", label: "Auxiliar" },
        };
        const config = roleConfig[role as keyof typeof roleConfig] || {
          color: "default",
          label: role,
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
      filters: [
        { text: "Administrador", value: "ADMINISTRADOR" },
        { text: "Vendedor", value: "VENDEDOR" },
        { text: "Auxiliar", value: "AUXILIAR" },
      ],
      onFilter: (value: any, record: UserPublic) => record.role === value,
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean = true) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Activo" : "Inactivo"}
        </Tag>
      ),
      filters: [
        { text: "Activo", value: true },
        { text: "Inactivo", value: false },
      ],
      onFilter: (value: any, record: UserPublic) =>
        (record.is_active ?? true) === value,
    },
    {
      title: "Superusuario",
      dataIndex: "is_superuser",
      key: "is_superuser",
      render: (isSuperuser: boolean = false) =>
        isSuperuser ? (
          <CrownOutlined style={{ color: "#f59e0b", fontSize: 18 }} />
        ) : null,
      filters: [
        { text: "Sí", value: true },
        { text: "No", value: false },
      ],
      onFilter: (value: any, record: UserPublic) =>
        (record.is_superuser ?? false) === value,
    },
    {
      title: "Acciones",
      key: "actions",
      width: 150,
      render: (_: any, record: UserPublic) => {
        const isCurrentUser = currentUser?.id === record.id;
        return (
          <Space>
            <Tooltip
              title={isCurrentUser ? "No puedes editarte a ti mismo" : "Editar"}
            >
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleOpenModal(record)}
                disabled={isCurrentUser}
              />
            </Tooltip>
            <Popconfirm
              title="¿Eliminar usuario?"
              description="Esta acción no se puede deshacer"
              onConfirm={() => handleDelete(record.id)}
              okText="Sí"
              cancelText="No"
              disabled={isCurrentUser}
            >
              <Tooltip
                title={
                  isCurrentUser ? "No puedes eliminarte a ti mismo" : "Eliminar"
                }
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={isCurrentUser}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const totalUsers = usersData?.count || 0;
  const activeUsers =
    usersData?.data.filter((user) => user.is_active ?? true).length || 0;

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Estadísticas */}
        <Row gutter={16}>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="Total de Usuarios"
                value={totalUsers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="Usuarios Activos"
                value={activeUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabla */}
        <Card
          title="Gestión de Usuarios"
          extra={
            <Space>
              <Search
                placeholder="Buscar usuarios..."
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
                Nuevo Usuario
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
              total: totalUsers,
              onChange: (newPage) =>
                navigate({
                  search: (prev: any) => ({ ...prev, page: newPage }),
                }),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} usuarios`,
            }}
          />
        </Card>
      </Space>

      {/* Modal para crear/editar */}
      <Modal
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
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
            name="email"
            label="Email"
            rules={[
              { required: true, message: "El email es requerido" },
              { type: "email", message: "Email inválido" },
            ]}
          >
            <Input placeholder="correo@ejemplo.com" />
          </Form.Item>

          <Form.Item name="full_name" label="Nombre Completo">
            <Input placeholder="Nombre completo del usuario" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              editingUser
                ? {}
                : { required: true, message: "La contraseña es requerida" },
              { min: 8, message: "Mínimo 8 caracteres" },
            ]}
          >
            <Input.Password
              placeholder={
                editingUser
                  ? "Dejar vacío para no cambiar"
                  : "Mínimo 8 caracteres"
              }
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: "Selecciona un rol" }]}
            initialValue="VENDEDOR"
          >
            <Select placeholder="Selecciona un rol">
              <Select.Option value="ADMINISTRADOR">Administrador</Select.Option>
              <Select.Option value="VENDEDOR">Vendedor</Select.Option>
              <Select.Option value="AUXILIAR">Auxiliar</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Estado"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_superuser"
                label="Superusuario"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch checkedChildren="Sí" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingUser ? "Actualizar" : "Crear"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Users;
