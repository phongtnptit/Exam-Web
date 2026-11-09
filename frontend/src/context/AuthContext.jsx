import { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

/**
 * AuthProvider - Quản lý trạng thái Đăng nhập toàn cục bằng React Context API
 * (Đáp ứng yêu cầu mục 2 của đề bài: "Context cho đăng nhập")
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khi F5 trình duyệt, kiểm tra token trong localStorage và lấy lại thông tin user
  useEffect(() => {
    const token = localStorage.getItem("ptit_exam_token");
    if (!token) {
      setLoading(false);
      return;
    }

    axiosClient
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.data);
      })
      .catch(() => {
        localStorage.removeItem("ptit_exam_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Hàm đăng nhập
  const login = async (email, password) => {
    const res = await axiosClient.post("/auth/login", { email, password });
    const { token, user: loggedUser } = res.data.data;
    localStorage.setItem("ptit_exam_token", token);
    setUser(loggedUser);
    return loggedUser;
  };

  // Hàm đăng ký
  const register = async (payload) => {
    const res = await axiosClient.post("/auth/register", payload);
    const { token, user: newUser } = res.data.data;
    localStorage.setItem("ptit_exam_token", token);
    setUser(newUser);
    return newUser;
  };

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem("ptit_exam_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
