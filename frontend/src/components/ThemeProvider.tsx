import React, { createContext, useContext, useState, useEffect } from "react";
import { ConfigProvider, theme as antdTheme, App } from "antd";
import esES from "antd/locale/es_ES";
import { lightTheme, darkTheme } from "../config/themeConfig";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Intentar obtener el tema guardado en localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    // Si no hay tema guardado, usar preferencia del sistema
    if (!savedTheme) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    return savedTheme;
  });

  useEffect(() => {
    // Guardar el tema en localStorage cuando cambie
    localStorage.setItem("theme", currentTheme);

    // Actualizar atributo en el HTML para estilos CSS globales
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Solo actualizar si no hay un tema guardado manualmente
      const savedTheme = localStorage.getItem("theme");
      if (!savedTheme) {
        setCurrentTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setCurrentTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const isDark = currentTheme === "dark";

  const themeConfig = currentTheme === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, toggleTheme, isDark }}>
      <ConfigProvider
        theme={{
          ...themeConfig,
          algorithm: isDark
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        }}
        locale={esES}
      >
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
