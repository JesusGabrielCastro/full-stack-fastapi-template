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
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Badge,
  Switch,
  Descriptions,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type {
  UserPublic,
  UserCreate,
  UserUpdate,
  UserUpdateMe,
  UpdatePassword,
  UserRole,
} from "../../client";
import { UsersService } from "../../client";
import { useNotification } from "../../hooks/useNotification";

const { Search } = Input;

const usersSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 10;

export const Route = createFileRoute("/_layout/users")({
  component: Users,
  validateSearch: (search) => usersSearchSchema.parse(search),
});

function Users() {
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [viewingUser, setViewingUser] = useState<UserPublic | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();

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

  // Query para ver detalles de un usuario específico
  const { data: userDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["user", viewingUser?.id],
    queryFn: () =>
      viewingUser
        ? UsersService.readUserById({ userId: viewingUser.id })
        : Promise.resolve(null),
    enabled: !!viewingUser,
  });

  // Mutación para crear usuario
  const createMutation = useMutation({
    mutationFn: (data: UserCreate) =>
      UsersService.createUser({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Usuario creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseModal();
    },
    onError: () => {
      showError("Error al crear el usuario");
    },
  });

  // Mutación para actualizar usuario (admin editando otro usuario)
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdate }) =>
      UsersService.updateUser({ userId, requestBody: data }),
    onSuccess: () => {
      showSuccess("Usuario actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseModal();
    },
    onError: () => {
      showError("Error al actualizar el usuario");
    },
  });

  // Mutación para actualizar perfil propio (usuario actual)
  const updateMeMutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Perfil actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseProfileModal();
    },
    onError: () => {
      showError("Error al actualizar el perfil");
    },
  });

  // Mutación para cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      UsersService.updatePasswordMe({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Contraseña actualizada exitosamente");
      handleClosePasswordModal();
    },
    onError: () => {
      showError("Error al actualizar la contraseña");
    },
  });

  // Mutación para eliminar usuario
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

  // Handlers para modal de creación/edición de usuarios (admin)
  const handleOpenModal = (user?: UserPublic) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        ...user,
        password: undefined,
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
    if (editingUser && !values.password) {
      delete values.password;
    }

    if (editingUser) {
      updateMutation.mutate({ userId: editingUser.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    profileForm.resetFields();
  };

  const handleProfileSubmit = async (values: UserUpdateMe) => {
    updateMeMutation.mutate(values);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    passwordForm.resetFields();
  };

  const handlePasswordSubmit = async (values: UpdatePassword) => {
    changePasswordMutation.mutate(values);
  };

  // Handlers para modal de vista de detalles
  const handleViewUser = (user: UserPublic) => {
    setViewingUser(user);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingUser(null);
  };

  const handleDelete = (userId: string) => {
    deleteMutation.mutate(userId);
  };

  // Filtrar usuarios localmente
  const filteredData = usersData?.data.filter(
    (user) =>
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchText.toLowerCase())
  );

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
      render: (role: UserRole) => {
        const roleColors: Record<UserRole, string> = {
          ADMINISTRADOR: "purple",
          AUXILIAR: "blue",
          VENDEDOR: "green",
        };
        return <Tag color={roleColors[role]}>{role}</Tag>;
      },
      filters: [
        { text: "Administrador", value: "ADMINISTRADOR" },
        { text: "Auxiliar", value: "AUXILIAR" },
        { text: "Vendedor", value: "VENDEDOR" },
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
      width: 200,
      render: (_: any, record: UserPublic) => {
        const isCurrentUser = currentUser?.id === record.id;
        return (
          <Space>
            <Tooltip title="Ver detalles">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewUser(record)}
              />
            </Tooltip>
            <Tooltip title={isCurrentUser ? "Usa 'Mi Perfil'" : "Editar"}>
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
          <Col xs={24} sm={12}>
            <Card bordered={false}>
              <Statistic
                title="Total de Usuarios"
                value={totalUsers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#6366f1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
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

      {/* Modal para crear/editar usuario (admin) */}
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
            name="role"
            label="Rol"
            rules={[{ required: true, message: "El rol es requerido" }]}
          >
            <Select placeholder="Selecciona un rol">
              <Select.Option value="ADMINISTRADOR">Administrador</Select.Option>
              <Select.Option value="AUXILIAR">Auxiliar</Select.Option>
              <Select.Option value="VENDEDOR">Vendedor</Select.Option>
            </Select>
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

      {/* Modal para editar perfil propio */}
      <Modal
        title="Mi Perfil"
        open={isProfileModalOpen}
        onCancel={handleCloseProfileModal}
        footer={null}
        width={500}
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileSubmit}
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
            <Input placeholder="Nombre completo" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCloseProfileModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMeMutation.isPending}
              >
                Actualizar Perfil
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para cambiar contraseña */}
      <Modal
        title="Cambiar Contraseña"
        open={isPasswordModalOpen}
        onCancel={handleClosePasswordModal}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="current_password"
            label="Contraseña Actual"
            rules={[
              { required: true, message: "La contraseña actual es requerida" },
              { min: 8, message: "Mínimo 8 caracteres" },
            ]}
          >
            <Input.Password placeholder="Contraseña actual" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="Nueva Contraseña"
            rules={[
              { required: true, message: "La nueva contraseña es requerida" },
              { min: 8, message: "Mínimo 8 caracteres" },
            ]}
          >
            <Input.Password placeholder="Nueva contraseña" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirmar Nueva Contraseña"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Confirma la nueva contraseña" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Las contraseñas no coinciden")
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirmar nueva contraseña" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleClosePasswordModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={changePasswordMutation.isPending}
              >
                Cambiar Contraseña
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para ver detalles de usuario */}
      <Modal
        title="Detalles del Usuario"
        open={isViewModalOpen}
        onCancel={handleCloseViewModal}
        footer={[
          <Button key="close" onClick={handleCloseViewModal}>
            Cerrar
          </Button>,
        ]}
        width={600}
      >
        {loadingDetails ? (
          <div>Cargando...</div>
        ) : userDetails ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Email">
              {userDetails.email}
            </Descriptions.Item>
            <Descriptions.Item label="Nombre Completo">
              {userDetails.full_name || "Sin nombre"}
            </Descriptions.Item>
            <Descriptions.Item label="Rol">
              <Tag
                color={
                  userDetails.role === "ADMIN"
                    ? "purple"
                    : userDetails.role === "GERENTE"
                      ? "blue"
                      : "green"
                }
              >
                {userDetails.role}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag
                color={userDetails.is_active ?? true ? "success" : "default"}
              >
                {userDetails.is_active ?? true ? "Activo" : "Inactivo"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Superusuario">
              {userDetails.is_superuser ?? false ? (
                <Tag color="gold" icon={<CrownOutlined />}>
                  Sí
                </Tag>
              ) : (
                <Tag>No</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </>
  );
}

export default Users;
