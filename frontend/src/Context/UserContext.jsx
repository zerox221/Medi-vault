import { createContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi";

export const userContext = createContext();

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("medivault_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("medivault_token") || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync session on mount with /auth/me
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("medivault_token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.getMe();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("medivault_user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn("Session validation failed:", err.message);
        localStorage.removeItem("medivault_token");
        localStorage.removeItem("medivault_user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginUser = async ({ email, password, role }) => {
    const res = await authApi.login({ email, password, role });
    if (res?.token && res?.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("medivault_token", res.token);
      localStorage.setItem("medivault_user", JSON.stringify(res.user));
    }
    return res;
  };

  const registerPatientUser = async (data) => {
    const res = await authApi.registerPatient(data);
    if (res?.token && res?.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("medivault_token", res.token);
      localStorage.setItem("medivault_user", JSON.stringify(res.user));
    }
    return res;
  };

  const registerDoctorUser = async (data) => {
    const res = await authApi.registerDoctor(data);
    if (res?.token && res?.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("medivault_token", res.token);
      localStorage.setItem("medivault_user", JSON.stringify(res.user));
    }
    return res;
  };

  const logoutUser = async () => {
    await authApi.logout();
    localStorage.removeItem("medivault_token");
    localStorage.removeItem("medivault_user");
    setUser(null);
    setToken(null);
  };

  const updateUserProfileState = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem("medivault_user", JSON.stringify(merged));
      return merged;
    });
  };

  const verifyEmailOtp = async (email, otp) => {
    const res = await authApi.verifyEmail(email, otp);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, isEmailVerified: true };
      localStorage.setItem("medivault_user", JSON.stringify(updated));
      return updated;
    });
    return res;
  };

  const values = {
    user,
    setUser,
    token,
    loading,
    login: loginUser,
    registerPatient: registerPatientUser,
    registerDoctor: registerDoctorUser,
    verifyEmail: verifyEmailOtp,
    logout: logoutUser,
    updateUser: updateUserProfileState,
  };

  return (
    <userContext.Provider value={values}>
      {children}
    </userContext.Provider>
  );
};

export default UserContextProvider;
