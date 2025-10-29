import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Modal,
  Alert,
} from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import type {
  Body_login_login_access_token as AccessToken,
  UserRegister,
} from "@/client";
import { UsersService } from "@/client";
import useAuth from "@/hooks/useAuth";
import { useNotification } from "@/hooks/useNotification";
import "./Login.css";

const { Title, Text, Link } = Typography;

export function Login() {
  const { loginMutation, error: loginError } = useAuth();
  const { contextHolder, showSuccess, showError } = useNotification();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Función simplificada para obtener mensaje de error
  const getErrorMessage = (error: any): string => {
    // Caso 1: Error con detail string
    if (error?.body?.detail && typeof error.body.detail === "string") {
      return error.body.detail;
    }

    // Caso 2: Error con detail array (validación)
    if (error?.body?.detail && Array.isArray(error.body.detail)) {
      const firstError = error.body.detail[0];
      if (firstError?.msg) {
        // Traducir mensajes comunes
        const msg = firstError.msg.toLowerCase();
        if (msg.includes("already registered"))
          return "Este correo ya está registrado";
        if (msg.includes("invalid")) return "Datos inválidos";
        return firstError.msg;
      }
    }

    // Caso 3: Por código de status
    if (error?.status === 409) return "El usuario ya existe";
    if (error?.status === 422) return "Error de validación en los datos";
    if (error?.status === 400) return "Solicitud inválida";
    if (error?.status === 500) return "Error del servidor";

    // Caso 4: Error genérico
    return "Error al procesar la solicitud";
  };

  // Mutación para registrar usuario
  const registerMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      UsersService.registerUser({ requestBody: data }),
    onSuccess: () => {
      showSuccess(
        "¡Usuario registrado exitosamente! Ahora puedes iniciar sesión"
      );
      setIsRegisterModalOpen(false);
      registerForm.resetFields();
      setRegisterError(null);
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      setRegisterError(errorMessage);
      showError(errorMessage);
    },
  });

  const onLoginFinish = async (values: AccessToken) => {
    loginMutation.mutate(values);
  };

  const onRegisterFinish = async (values: UserRegister) => {
    setRegisterError(null);
    registerMutation.mutate(values);
  };

  const handleOpenRegisterModal = () => {
    setIsRegisterModalOpen(true);
    setRegisterError(null);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
    registerForm.resetFields();
    setRegisterError(null);
  };

  return (
    <>
      {/* CRÍTICO: Renderizar contextHolder */}
      {contextHolder}

      <div className="login-container">
        {/* Fondo animado */}
        <div className="login-background">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>

        {/* Card del formulario */}
        <Card
          className="login-card"
          style={{
            maxWidth: 450,
            width: "100%",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
          }}
        >
          {/* Logo y título */}
          <Space
            direction="vertical"
            size="large"
            style={{ width: "100%", textAlign: "center" }}
          >
            <div className="login-logo">📦</div>
            <div>
              <Title level={2} style={{ margin: 0, color: "#6366f1" }}>
                Inventory Express
              </Title>
              <Text type="secondary">Sistema de Gestión de Inventario</Text>
            </div>
          </Space>

          <Divider />

          {/* Alerta de error de login */}
          {loginError && (
            <Alert
              message="Error al iniciar sesión"
              description={getErrorMessage(loginError)}
              type="error"
              showIcon
              closable
              style={{
                marginBottom: "2rem"
              }}
            />
          )}

          {/* Formulario de Login */}
          <Form
            form={loginForm}
            name="login"
            onFinish={onLoginFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Por favor ingresa tu correo" },
                { type: "email", message: "Ingresa un correo válido" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "rgba(0,0,0,0.45)" }} />}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Por favor ingresa tu contraseña" },
                {
                  min: 8,
                  message: "La contraseña debe tener al menos 8 caracteres",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,0.45)" }} />}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loginMutation.isPending}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Iniciar Sesión
              </Button>
            </Form.Item>

            {/* Enlaces */}
            <div style={{ textAlign: "center" }}>
              <Space direction="vertical" size="small">
                <Text type="secondary">
                  ¿No tienes cuenta?{" "}
                  <Link
                    onClick={handleOpenRegisterModal}
                    style={{
                      color: "#6366f1",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Regístrate aquí
                  </Link>
                </Text>
              </Space>
            </div>
          </Form>
        </Card>

        {/* Modal de Registro */}
        <Modal
          title={
            <Space>
              <UserOutlined style={{ color: "#6366f1" }} />
              <span>Crear Nueva Cuenta</span>
            </Space>
          }
          open={isRegisterModalOpen}
          onCancel={handleCloseRegisterModal}
          footer={null}
          width={500}
          destroyOnClose
        >
          {/* Alerta de error de registro */}
          {registerError && (
            <Alert
              message="Error"
              description={registerError}
              type="error"
              showIcon
              closable
              onClose={() => setRegisterError(null)}
              style={{ marginBottom: 16 }}
            />
          )}

          <Form
            form={registerForm}
            name="register"
            onFinish={onRegisterFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="email"
              label="Correo Electrónico"
              rules={[
                { required: true, message: "El correo es requerido" },
                { type: "email", message: "Ingresa un correo válido" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="full_name"
              label="Nombre Completo"
              rules={[
                { required: true, message: "El nombre completo es requerido" },
                {
                  min: 3,
                  message: "El nombre debe tener al menos 3 caracteres",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Juan Pérez"
                autoComplete="name"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: "La contraseña es requerida" },
                {
                  min: 8,
                  message: "La contraseña debe tener al menos 8 caracteres",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirm_password"
              label="Confirmar Contraseña"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Por favor confirma tu contraseña" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
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
                prefix={<LockOutlined />}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={handleCloseRegisterModal}>Cancelar</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={registerMutation.isPending}
                >
                  Registrarse
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Footer */}
        <Text
          type="secondary"
          style={{
            position: "absolute",
            bottom: 45,
            textAlign: "center",
            fontSize: 12,
          }}
        >
          © 2025 Inventory Express. Todos los derechos reservados.
        </Text>
      </div>
    </>
  );
}
