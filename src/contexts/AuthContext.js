import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config';

const AuthContext = createContext();

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER)
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      // Silent fail - user will need to login again
    } finally {
      setLoading(false);
    }
  };

  const login = async (data) => {
    try {
      if (data.user && !data.user._id) {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          data.user = { ...data.user, _id: userData._id };
        }
      }

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user)),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token)
      ]);
      
      setUser(data.user);
      setToken(data.token);
    } catch {
      throw new Error('Échec de la connexion');
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER)
      ]);
      setToken(null);
      setUser(null);
    } catch {
      throw new Error('Échec de la déconnexion');
    }
  };

  const getToken = async () => {
    // Si le token est déjà en mémoire
    if (token) {
      return token;
    }
    
    // Sinon essayer de le récupérer depuis AsyncStorage
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      return storedToken;
    } catch (error) {
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};