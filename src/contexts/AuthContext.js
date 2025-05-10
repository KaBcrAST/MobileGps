import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config'; 
const AuthContext = createContext();

const STORAGE_KEYS = {
  TOKEN: 'authToken', // ⚠️ Changé pour correspondre à ce que vous utilisez déjà
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
      console.error('Erreur lors du chargement des données d\'authentification:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (authData) => {
    try {
      if (!authData.token || !authData.user) {
        throw new Error('Données d\'authentification incomplètes');
      }
      
      // Stockage du token et des informations utilisateur
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authData.token),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user))
      ]);
      
      // Mise à jour de l'état
      setToken(authData.token);
      setUser(authData.user);
      
      return true;
    } catch (error) {
      console.error('Error storing auth data:', error);
      return false;
    }
  };

  // Fonction pour mettre à jour les informations utilisateur
  const updateUserInfo = async (updatedUser) => {
    try {
      if (!updatedUser) {
        throw new Error('Informations utilisateur manquantes');
      }
      
      // Mettre à jour dans AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      // Mettre à jour l'état
      setUser(updatedUser);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations utilisateur:', error);
      return false;
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
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw new Error('Échec de la déconnexion');
    }
  };

  // Fonction pour récupérer le token actuel
  const getToken = async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  };

  // Ajoutez cette fonction pour actualiser les données utilisateur
  const refreshUserData = async () => {
    try {
      // Vérifier si l'utilisateur est connecté
      if (!token) {
        return false;
      }

      // Récupérer le token actuel
      const currentToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      
      // Faire une requête à l'API pour obtenir les données à jour
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Mettre à jour les informations utilisateur dans le state
        setUser(data.user);
        
        // Mettre à jour le stockage local
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        
        return true;
      } else {
        console.error('Échec de l\'actualisation des données utilisateur:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des données utilisateur:', error);
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUserInfo,
    getToken,
    refreshUserData // Exposer la nouvelle fonction
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