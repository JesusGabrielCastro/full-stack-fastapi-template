import { message } from "antd";

// Hook personalizado para notificaciones toast
export const useNotification = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showSuccess = (content: string, duration = 3) => {
    messageApi.success({
      content,
      duration,
      style: {
        marginTop: "10vh",
      },
    });
  };

  const showError = (content: string, duration = 4) => {
    messageApi.error({
      content,
      duration,
      style: {
        marginTop: "10vh",
      },
    });
  };

  const showWarning = (content: string, duration = 3) => {
    messageApi.warning({
      content,
      duration,
      style: {
        marginTop: "10vh",
      },
    });
  };

  const showInfo = (content: string, duration = 3) => {
    messageApi.info({
      content,
      duration,
      style: {
        marginTop: "10vh",
      },
    });
  };

  const showLoading = (content: string) => {
    return messageApi.loading({
      content,
      duration: 0,
      style: {
        marginTop: "10vh",
      },
    });
  };

  return {
    contextHolder,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
};
