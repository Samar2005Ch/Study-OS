import { createContext, useContext, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("studyos_token") || null);
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("studyos_user") || "null"); } catch { return null; }
  });

  function login(newToken, newUser) {
    setToken(newToken); setUser(newUser);
    localStorage.setItem("studyos_token", newToken);
    localStorage.setItem("studyos_user", JSON.stringify(newUser));
  }

  function logout() {
    setToken(null); setUser(null);
    localStorage.removeItem("studyos_token");
    localStorage.removeItem("studyos_user");
  }

  return (
    <AuthCtx.Provider value={{ token, user, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
