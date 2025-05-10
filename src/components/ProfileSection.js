import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';
import axios from 'axios';
import { API_URL } from '../config/config';

const ProfileSection = () => {
  const { user, updateUserInfo, getToken, refreshUserData } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Fonction de rafraîchissement silencieux (sans alertes)
  const silentRefresh = useCallback(async () => {
    if (refreshing) return; // Éviter les rafraîchissements simultanés
    setRefreshing(true);
    
    try {
      await refreshUserData();
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Erreur lors du rafraîchissement automatique:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUserData, refreshing]);

  // Effet pour le rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    if (!user) return; // Ne pas rafraîchir si l'utilisateur n'est pas connecté
    
    // Rafraîchir immédiatement au montage du composant
    silentRefresh();
    
    // Configurer l'intervalle de rafraîchissement (30 secondes)
    const refreshInterval = setInterval(() => {
      silentRefresh();
    }, 30000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(refreshInterval);
  }, [user, silentRefresh]);

  // Si getToken n'est pas disponible dans votre contexte, utilisez cette fonction
  const getAuthToken = async () => {
    if (typeof getToken === 'function') {
      return await getToken();
    }
    
    // Fallback si getToken n'est pas disponible
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  };

  // Même chose pour updateUserInfo
  const updateUserData = async (updatedUser) => {
    if (typeof updateUserInfo === 'function') {
      return await updateUserInfo(updatedUser);
    }
    
    // Fallback si updateUserInfo n'est pas disponible
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations utilisateur:', error);
      return false;
    }
  };

  const handleEditPicture = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission requise", "Vous devez autoriser l'accès à votre galerie pour changer votre photo de profil.");
        return;
      }
      
      // Utiliser la syntaxe correcte pour la version actuelle d'expo-image-picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Réduire la qualité pour avoir un fichier plus petit
        maxWidth: 500, // Limiter la résolution
        maxHeight: 500, // Limiter la résolution
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Image sélectionnée:', result.assets[0]);
        
        // Vérification de la taille de l'image
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        console.log('Taille du fichier:', fileInfo.size);
        
        // Si l'image est trop grande, afficher un avertissement
        if (fileInfo.size > 2 * 1024 * 1024) { // 2MB
          Alert.alert(
            "Image volumineuse", 
            "L'image sélectionnée est assez volumineuse, ce qui pourrait causer des problèmes d'upload. Souhaitez-vous continuer?",
            [
              {
                text: "Annuler",
                style: "cancel"
              },
              { 
                text: "Continuer", 
                onPress: () => uploadProfilePicture(result.assets[0].uri)
              }
            ]
          );
        } else {
          uploadProfilePicture(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de la photo:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image. Veuillez réessayer.');
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    try {
      setLoading(true);
      
      // Récupérer et vérifier le token d'authentification
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Erreur d\'authentification', 'Veuillez vous reconnecter et réessayer.');
        return;
      }
      
      // Afficher des informations sur l'image pour le débogage
      console.log('Image URI:', imageUri);
      console.log('Token présent:', !!token);
      
      // Créer un formData pour l'upload de l'image
      const formData = new FormData();
      
      // Extraire le nom et le type du fichier
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg'; // Type par défaut en cas d'échec
      
      console.log('Filename:', filename);
      console.log('Type:', type);
      
      // Configurer l'image avec tous les champs nécessaires
      const imageData = {
        uri: imageUri,
        name: filename,
        type
      };
      
      console.log('Image data:', imageData);
      
      formData.append('profilePicture', imageData);
      
      // Ajouter un timeout plus long pour les uploads volumineux
      const response = await axios.post(`${API_URL}/api/profile/picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000 // 30 secondes
      });
      
      if (response.data.success) {
        // Mettre à jour les informations utilisateur
        const success = await updateUserData(response.data.user);
        if (success) {
          Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      
      // Afficher des informations détaillées sur l'erreur
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        console.error('Statut de l\'erreur:', error.response.status);
        console.error('Données de l\'erreur:', error.response.data);
        console.error('En-têtes de l\'erreur:', error.response.headers);
        
        if (error.response.status === 500) {
          Alert.alert(
            'Erreur serveur', 
            'Une erreur est survenue sur le serveur. Cela peut être dû à la taille de l\'image ou à un problème de traitement. Essayez une image plus petite.'
          );
        } else if (error.response.status === 401) {
          Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
        } else {
          Alert.alert('Erreur', `Impossible de mettre à jour la photo de profil. Code: ${error.response.status}`);
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Requête sans réponse:', error.request);
        Alert.alert('Erreur réseau', 'Le serveur ne répond pas. Vérifiez votre connexion internet.');
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error('Erreur de configuration:', error.message);
        Alert.alert('Erreur', 'Une erreur est survenue lors de la préparation de l\'upload.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user.email) {
      setShowEditEmail(false);
      return;
    }
    
    // Validation simple de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }
    
    try {
      setLoading(true);
      
      // Récupérer et vérifier le token d'authentification
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Erreur d\'authentification', 'Veuillez vous reconnecter et réessayer.');
        return;
      }
      
      const response = await axios.put(`${API_URL}/api/profile/email`, 
        { email: newEmail }, 
        { 
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Mise à jour via le contexte d'authentification
        if (typeof updateUserInfo === 'function') {
          await updateUserInfo(response.data.user);
        } else {
          // Backup: rafraîchir les données
          await refreshUserData();
        }
        
        Alert.alert('Succès', 'Adresse email mise à jour avec succès');
        setShowEditEmail(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'email:', error);
      if (error.response && error.response.status === 401) {
        Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
      } else {
        Alert.alert('Erreur', error.response?.data?.message || 'Impossible de mettre à jour l\'email. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rafraîchir manuellement les données utilisateur
  const handleRefreshUserData = async () => {
    setRefreshing(true);
    const success = await refreshUserData();
    if (success) {
      Alert.alert('Succès', 'Informations utilisateur mises à jour');
    } else {
      Alert.alert('Erreur', 'Impossible d\'actualiser les informations utilisateur');
    }
    setRefreshing(false);
  };

  // Function pour rafraîchir manuellement avec feedback visuel
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const success = await refreshUserData();
      if (!success) {
        // Notification uniquement en cas d'échec
        Alert.alert('Erreur', 'Impossible d\'actualiser les informations utilisateur');
      }
      setLastRefresh(Date.now());
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.profileSection}>
      <TouchableOpacity 
        style={styles.profileImage}
        onPress={user ? handleEditPicture : () => setShowLogin(true)}
      >
        {user?.picture ? (
          <Image 
            source={{ uri: user.picture }} 
            style={styles.profilePicture}
          />
        ) : (
          <Ionicons name="person" size={40} color="#666" />
        )}
        {user && (
          <View style={styles.editIconContainer}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      
      {user ? (
        <>
          <View style={styles.userInfoContainer}>
            <Text style={styles.welcomeText}>
              Bonjour {user.name}
            </Text>
            
            <TouchableOpacity 
              style={styles.emailContainer}
              onPress={() => {
                setNewEmail(user.email);
                setShowEditEmail(true);
              }}
            >
              <Text style={styles.emailText}>{user.email}</Text>
              <Ionicons name="pencil" size={16} color="#3498db" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings" size={24} color="#333" />
          </TouchableOpacity>
          
          <SettingsModal 
            visible={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </>
      ) : (
        <>
          <TouchableOpacity onPress={() => setShowLogin(true)}>
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>
          <LoginModal 
            visible={showLogin}
            onClose={() => setShowLogin(false)}
          />
        </>
      )}
      
      {/* Modal pour éditer l'email */}
      <Modal
        visible={showEditEmail}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier votre email</Text>
            
            <TextInput
              style={styles.emailInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Nouvel email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowEditEmail(false)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateEmail}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Chargement...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 40,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#3498db',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  settingsButton: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default ProfileSection;