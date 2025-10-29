import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  type Body_login_login_access_token as AccessToken,
  type ApiError,
  LoginService,
  type UserPublic,
  type UserRegister,
  UsersService,
} from "@/client";
import { handleError } from "@/utils";

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null;
};

const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🔹 Estado global del usuario actual
  const { data: user } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: UsersService.readUserMe,
    enabled: isLoggedIn(),
  });

  // 🔹 MUTACIÓN: Registro de usuario
  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      UsersService.registerUser({ requestBody: data }),

    onSuccess: () => {
      navigate({ to: "/login" });
    },
    onError: (err: ApiError) => {
      handleError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // 🔹 Función para login
  const login = async (data: AccessToken) => {
    const response = await LoginService.loginAccessToken({
      formData: data,
    });

    localStorage.setItem("access_token", response.access_token);
  };

  // 🔹 MUTACIÓN: Inicio de sesión
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/" });
    },
    onError: (err: ApiError) => {
      // ✅ Aquí se lanza el mensaje de error y notificación
      handleError(err);
    },
  });

  // 🔹 Cierre de sesión
  const logout = () => {
    localStorage.removeItem("access_token");
    navigate({ to: "/login" });
  };

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,

    // ✅ Ahora el componente Login puede mostrar errores directamente
    error: loginMutation.error,
    resetError: () => loginMutation.reset(),
  };
};

export { isLoggedIn };
export default useAuth;