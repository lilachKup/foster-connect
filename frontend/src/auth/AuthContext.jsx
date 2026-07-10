import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On load, if we have a token, resolve the current user.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadCurrentUser() {
    const res = await client.get("/auth/me");
    setUser(res.data);
    return res.data;
  }

  // Log in with email/password. Backend expects OAuth2 form-encoded body.
  async function login(email, password) {
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);
    const res = await client.post("/auth/login", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("token", res.data.access_token);
    return loadCurrentUser();
  }

  // Store a token returned by a register endpoint, then load the user.
  async function setToken(token) {
    localStorage.setItem("token", token);
    return loadCurrentUser();
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
