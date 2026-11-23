import { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { useExamStore } from "../store/useExamStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email, password) => {
    const res = await axiosClient.post("/auth/login", { email, password });
    const { token, user: loggedUser } = res.data.data;
    localStorage.setItem("ptit_exam_token", token);
    setUser(loggedUser);
    return loggedUser;
  };

  // Dang ky chi tao tai khoan chua xac minh, KHONG tu dang nhap: tra ve
  // { email, needsVerification, emailSent } de RegisterPage chuyen sang
  // trang nhap ma 6 so.
  const register = async (payload) => {
    const res = await axiosClient.post("/auth/register", payload);
    return res.data.data;
  };

  const verifyEmail = async (email, code) => {
    const res = await axiosClient.post("/auth/verify-email", { email, code });
    const { token, user: verifiedUser } = res.data.data;
    localStorage.setItem("ptit_exam_token", token);
    setUser(verifiedUser);
    return verifiedUser;
  };

  const resendCode = async (email) => {
    const res = await axiosClient.post("/auth/resend-code", { email });
    return res.data;
  };

  const logout = () => {
    useExamStore.getState().resetExamSession();
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
        verifyEmail,
        resendCode,
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
