import React from "react";
import { Button, Tooltip } from "antd";
import { BulbOutlined, BulbFilled } from "@ant-design/icons";
import { useTheme } from "./ThemeProvider";
import "./ThemeToggle.css";

interface ThemeToggleProps {
  size?: "small" | "middle" | "large";
  type?: "default" | "text" | "link" | "primary" | "dashed";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = "middle",
  type = "text",
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <Tooltip title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
      <Button
        type={type}
        size={size}
        icon={isDark ? <BulbFilled /> : <BulbOutlined />}
        onClick={toggleTheme}
        className="theme-toggle-button"
      />
    </Tooltip>
  );
};
