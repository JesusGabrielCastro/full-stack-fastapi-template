import { Form, Input, Button, Card, Typography, Space, Divider } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import type { Body_login_login_access_token as AccessToken } from "@/client";
import useAuth from "@/hooks/useAuth";
import "./Login.css";

const { Title, Text } = Typography;

export function Login() {
  const { loginMutation } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values: AccessToken) => {
    loginMutation.mutate(values);
  };

  return (
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

        {/* Formulario */}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
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
              prefix={<MailOutlined style={{ color: "rgba(255,255,255,1)" }} />}
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
              prefix={<LockOutlined style={{ color: "rgba(255,255,255,1)" }} />}
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

          {/* Enlaces
          <div style={{ textAlign: "center" }}>
            <Space direction="vertical" size="small">
              <Link to="/recover-password" style={{ color: "#6366f1" }}>
                ¿Olvidaste tu contraseña?
              </Link>
              <Text type="secondary">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/signup"
                  style={{ color: "#6366f1", fontWeight: 500 }}
                >
                  Regístrate aquí
                </Link>
              </Text>
            </Space>
          </div> */}
        </Form>
      </Card>

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
  );
}
