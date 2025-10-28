import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Tabs,
  Typography,
  Divider,
  Avatar,
  Alert,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserUpdateMe, UpdatePassword } from "@/client";
import { UsersService } from "@/client";
import useAuth from "@/hooks/useAuth";
import { useNotification } from "@/hooks/useNotification";
import { ThemeToggle } from "@/components/ThemeToggle";

const { Title, Text } = Typography;

export const Route = createFileRoute("/_layout/settings")({
  component: Settings,
});

function Settings() {
  const { user: currentUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const { contextHolder, showSuccess, showError } = useNotification();

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Mutación para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Perfil actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: () => {
      showError("Error al actualizar el perfil");
    },
  });

  // Mutación para cambiar contraseña
  const updatePasswordMutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      UsersService.updatePasswordMe({ requestBody: data }),
    onSuccess: () => {
      showSuccess("Contraseña actualizada exitosamente");
      passwordForm.resetFields();
    },
    onError: () => {
      showError("Error al actualizar la contraseña");
    },
  });

  // Mutación para eliminar cuenta
  const deleteAccountMutation = useMutation({
    mutationFn: () => UsersService.deleteUserMe(),
    onSuccess: () => {
      showSuccess("Cuenta eliminada exitosamente");
      logout();
    },
    onError: () => {
      showError("Error al eliminar la cuenta");
    },
  });

  const handleUpdateProfile = async (values: UserUpdateMe) => {
    updateProfileMutation.mutate(values);
  };

  const handleUpdatePassword = async (values: UpdatePassword) => {
    updatePasswordMutation.mutate(values);
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  const tabItems = [
    {
      key: "profile",
      label: (
        <span>
          <UserOutlined />
          Mi Perfil
        </span>
      ),
      children: (
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Avatar y info básica */}
            <div style={{ textAlign: "center" }}>
              <Avatar
                size={100}
                style={{ backgroundColor: "#6366f1", fontSize: 40 }}
                icon={<UserOutlined />}
              >
                {currentUser?.full_name?.charAt(0) ||
                  currentUser?.email?.charAt(0)}
              </Avatar>
              <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {currentUser?.full_name || "Sin nombre"}
              </Title>
              <Text type="secondary">{currentUser?.email}</Text>
              <div style={{ marginTop: 8 }}>
                {currentUser?.is_superuser && (
                  <Alert
                    message="Eres un superusuario"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </div>
            </div>

            <Divider />

            {/* Formulario de perfil */}
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                full_name: currentUser?.full_name,
                email: currentUser?.email,
              }}
            >
              <Form.Item
                name="full_name"
                label="Nombre Completo"
                rules={[
                  { required: true, message: "El nombre es requerido" },
                  { max: 255, message: "Máximo 255 caracteres" },
                ]}
              >
                <Input
                  prefix={
                    <UserOutlined style={{ color: "rgba(0,0,0,0.25)" }} />
                  }
                  placeholder="Tu nombre completo"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Correo Electrónico"
                rules={[
                  { required: true, message: "El email es requerido" },
                  { type: "email", message: "Email inválido" },
                ]}
              >
                <Input
                  prefix={
                    <MailOutlined style={{ color: "rgba(0,0,0,0.25)" }} />
                  }
                  placeholder="tu@email.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={updateProfileMutation.isPending}
                  size="large"
                  block
                >
                  Guardar Cambios
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      ),
    },
    {
      key: "password",
      label: (
        <span>
          <LockOutlined />
          Contraseña
        </span>
      ),
      children: (
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Title level={4}>Cambiar Contraseña</Title>
              <Text type="secondary">
                Asegúrate de usar una contraseña segura con al menos 8
                caracteres
              </Text>
            </div>

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleUpdatePassword}
            >
              <Form.Item
                name="current_password"
                label="Contraseña Actual"
                rules={[
                  {
                    required: true,
                    message: "La contraseña actual es requerida",
                  },
                  { min: 8, message: "Mínimo 8 caracteres" },
                ]}
              >
                <Input.Password
                  prefix={
                    <LockOutlined style={{ color: "rgba(0,0,0,0.25)" }} />
                  }
                  placeholder="Tu contraseña actual"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="new_password"
                label="Nueva Contraseña"
                rules={[
                  {
                    required: true,
                    message: "La nueva contraseña es requerida",
                  },
                  { min: 8, message: "Mínimo 8 caracteres" },
                ]}
              >
                <Input.Password
                  prefix={
                    <LockOutlined style={{ color: "rgba(0,0,0,0.25)" }} />
                  }
                  placeholder="Tu nueva contraseña"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="Confirmar Nueva Contraseña"
                dependencies={["new_password"]}
                rules={[
                  { required: true, message: "Confirma tu nueva contraseña" },
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
                <Input.Password
                  prefix={
                    <LockOutlined style={{ color: "rgba(0,0,0,0.25)" }} />
                  }
                  placeholder="Confirma tu nueva contraseña"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={updatePasswordMutation.isPending}
                  size="large"
                  block
                >
                  Actualizar Contraseña
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      ),
    },
    {
      key: "appearance",
      label: (
        <span>
          <UserOutlined />
          Apariencia
        </span>
      ),
      children: (
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Title level={4}>Tema de la Aplicación</Title>
              <Text type="secondary">
                Personaliza la apariencia de la aplicación según tus
                preferencias
              </Text>
            </div>

            <Divider />

            <div>
              <Text strong>Modo de Color</Text>
              <div style={{ marginTop: 16 }}>
                <Space>
                  <ThemeToggle size="large" type="default" />
                  <Text>Cambiar entre modo claro y oscuro</Text>
                </Space>
              </div>
            </div>
          </Space>
        </Card>
      ),
    },
    ...(!currentUser?.is_superuser
      ? [
          {
            key: "danger",
            label: (
              <span>
                <DeleteOutlined />
                Zona de Peligro
              </span>
            ),
            children: (
              <Card bordered={false} style={{ borderRadius: 12 }}>
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  <Alert
                    message="Zona de Peligro"
                    description="Las acciones en esta sección son irreversibles. Por favor, procede con precaución."
                    type="error"
                    showIcon
                  />

                  <div>
                    <Title level={4}>Eliminar Cuenta</Title>
                    <Text type="secondary">
                      Una vez eliminada tu cuenta, no hay vuelta atrás. Por
                      favor, estáaseguro.
                    </Text>
                  </div>

                  <Popconfirm
                    title="¿Eliminar tu cuenta?"
                    description="Esta acción no se puede deshacer. ¿Estás seguro?"
                    onConfirm={handleDeleteAccount}
                    okText="Sí, eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      size="large"
                      loading={deleteAccountMutation.isPending}
                    >
                      Eliminar mi cuenta permanentemente
                    </Button>
                  </Popconfirm>
                </Space>
              </Card>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Title level={2} style={{ margin: 0 }}>
            Configuración de Usuario
          </Title>
          <Text type="secondary">
            Administra tu perfil, contraseña y preferencias de la aplicación
          </Text>
        </Card>

        <Tabs defaultActiveKey="profile" items={tabItems} />
      </Space>
    </>
  );
}

export default Settings;
