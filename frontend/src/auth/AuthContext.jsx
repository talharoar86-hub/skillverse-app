import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from '../services/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshToken = useCallback(async () => {
    const storedUser = JSON.parse(localStorage.getItem("skillverse_user"));
    if (!storedUser?.refreshToken) throw new Error("No refresh token");

    const { data } = await api.post('/auth/refresh', {
      refreshToken: storedUser.refreshToken
    });

    storedUser.accessToken = data.accessToken;
    localStorage.setItem("skillverse_user", JSON.stringify(storedUser));
    setUser(prev => prev ? { ...prev, accessToken: data.accessToken } : null);
    return data.accessToken;
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("skillverse_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          // Try refreshing the token first if we have a refresh token
          if (parsed.refreshToken) {
            try {
              await refreshToken();
            } catch {
              // Refresh failed, but continue - the interceptor may handle it
            }
          }
          // Verify token with backend
          const { data } = await api.get('/auth/me');
          const latestStored = JSON.parse(localStorage.getItem("skillverse_user"));
          setUser({ ...data, accessToken: latestStored?.accessToken, refreshToken: latestStored?.refreshToken });
        } catch (err) {
          console.error("Session expired or invalid token", err);
          localStorage.removeItem("skillverse_user");
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [refreshToken]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data);
    localStorage.setItem("skillverse_user", JSON.stringify(data));
    return data;
  };

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    setUser(data);
    localStorage.setItem("skillverse_user", JSON.stringify(data));
    return data;
  };

  const setOAuthSession = async (accessToken) => {
    // Immediately set token so 'api' instance can construct Bearer header
    localStorage.setItem("skillverse_user", JSON.stringify({ accessToken }));
    try {
      const { data } = await api.get('/auth/me');
      const updatedUser = { ...data, accessToken };
      setUser(updatedUser);
      localStorage.setItem("skillverse_user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to verify OAuth session', err);
      logout();
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch(err) {
      console.error(err);
    }
    setUser(null);
    localStorage.removeItem("skillverse_user");
  };

  const completeOnboarding = async () => {
    // Refresh user data from backend after onboarding update
    const { data } = await api.get('/auth/me');
    const storedUser = JSON.parse(localStorage.getItem('skillverse_user'));
    const updatedUser = { ...data, accessToken: storedUser.accessToken, refreshToken: storedUser.refreshToken };
    setUser(updatedUser);
    localStorage.setItem("skillverse_user", JSON.stringify(updatedUser));
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem("skillverse_user", JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, completeOnboarding, updateUser, isLoading, setOAuthSession, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
