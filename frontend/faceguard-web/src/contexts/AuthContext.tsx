import { createContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { apiService } from "../services/api.service";
import { tokenUtils } from "../utils/token.utils";
import { AuthContextType, User, LoginRequest, RegisterRequest } from "../types/auth.types";

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = tokenUtils.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      tokenUtils.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiService.login(credentials);
      tokenUtils.setToken(response.access_token);

      const userData = await apiService.getCurrentUser();
      setUser(userData);

      toast.success("Welcome back!");
      window.location.href = "/";
    } catch (error: any) {
      const message = error.response?.data?.detail || "Login failed";
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const userData = await apiService.register(data);
      toast.success("Registration successful! Please login.");
      window.location.href = "/login";
    } catch (error: any) {
      const message = error.response?.data?.detail || "Registration failed";
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    tokenUtils.removeToken();
    setUser(null);
    toast.success("Logged out successfully");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
