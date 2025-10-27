import { ThemeConfig } from "antd";

// Paleta de colores moderna y minimalista
export const colors = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // Grises
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
};

// Configuración del tema light
export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,

    // Bordes redondeados
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    // Fuentes
    fontSize: 14,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    // Colores de fondo
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBgLayout: colors.gray[50],

    // Sombras suaves
    boxShadow:
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    boxShadowSecondary:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",

    // Texto
    colorText: colors.gray[900],
    colorTextSecondary: colors.gray[600],
    colorTextTertiary: colors.gray[500],

    // Bordes
    colorBorder: colors.gray[200],
    colorBorderSecondary: colors.gray[100],
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 500,
      primaryShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
    },
    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingBlock: 8,
      paddingInline: 12,
    },
    Select: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
    },
    Card: {
      boxShadow:
        "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      borderRadiusLG: 16,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Table: {
      borderRadius: 12,
      headerBg: colors.gray[50],
    },
    Message: {
      contentBg: "#ffffff",
      borderRadiusLG: 12,
    },
  },
};

// Configuración del tema dark
export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,

    // Bordes redondeados
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    // Fuentes
    fontSize: 14,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    // Colores de fondo dark
    colorBgContainer: colors.gray[800],
    colorBgElevated: colors.gray[800],
    colorBgLayout: colors.gray[900],

    // Sombras en dark mode
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
    boxShadowSecondary:
      "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",

    // Texto en dark
    colorText: colors.gray[50],
    colorTextSecondary: colors.gray[300],
    colorTextTertiary: colors.gray[400],

    // Bordes en dark
    colorBorder: colors.gray[700],
    colorBorderSecondary: colors.gray[800],
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 500,
      primaryShadow: "0 2px 4px rgba(99, 102, 241, 0.3)",
    },
    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingBlock: 8,
      paddingInline: 12,
    },
    Select: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
    },
    Card: {
      boxShadow:
        "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
      borderRadiusLG: 16,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Table: {
      borderRadius: 12,
      headerBg: colors.gray[900],
    },
    Message: {
      contentBg: colors.gray[800],
      borderRadiusLG: 12,
    },
  },
};
