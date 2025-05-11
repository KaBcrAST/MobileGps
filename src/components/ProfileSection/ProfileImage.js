import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { API_URL } from '../../config/config';
import { useAuth } from '../../contexts/AuthContext';

const ProfileImage = ({ user, onPress, themeColor = 'rgb(74, 58, 255)' }) => {
  const { updateUserInfo, getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleEditPicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission requise", "Vous devez autoriser l'accès à votre galerie pour changer votre photo de profil.");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        maxWidth: 500,
        maxHeight: 500,
        base64: true, // Important: on demande l'image en base64
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        // Vérifier la taille de l'image
        const fileInfo = await FileSystem.getInfoAsync(selectedImage.uri);
        
        if (fileInfo.size > 5 * 1024 * 1024) { // 5MB (limite côté serveur)
          Alert.alert(
            "Image trop volumineuse", 
            "L'image sélectionnée dépasse la limite de 5MB. Veuillez choisir une image plus petite.",
            [{ text: "OK", style: "default" }]
          );
          return;
        }
        
        if (fileInfo.size > 2 * 1024 * 1024) { // 2MB (avertissement)
          Alert.alert(
            "Image volumineuse", 
            "L'image sélectionnée est assez volumineuse, ce qui pourrait causer des problèmes d'upload. Souhaitez-vous continuer?",
            [
              { text: "Annuler", style: "cancel" },
              { text: "Continuer", onPress: () => uploadProfilePicture(selectedImage) }
            ]
          );
        } else {
          uploadProfilePicture(selectedImage);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image. Veuillez réessayer.');
    }
  };

  const uploadProfilePicture = async (imageAsset) => {
    try {
      setLoading(true);
      
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur d\'authentification', 'Veuillez vous reconnecter et réessayer.');
        return;
      }

      // Préparation des données selon l'API
      let base64Image;
      
      // Si l'image a déjà été convertie en base64 par ImagePicker
      if (imageAsset.base64) {
        base64Image = `data:image/jpeg;base64,${imageAsset.base64}`;
      } 
      // Sinon, on la convertit nous-mêmes (cas de secours)
      else {
        const base64 = await FileSystem.readAsStringAsync(imageAsset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Image = `data:image/jpeg;base64,${base64}`;
      }
      
      // Préparer les données selon le format attendu par l'API
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageAsset.uri,
        name: 'profile-picture.jpg',
        type: 'image/jpeg'
      });
      
      // Faire la requête à l'API
      const response = await axios.post(
        `${API_URL}/api/profile/picture`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        }
      );
      
      if (response.data.success) {
        // Mise à jour du contexte utilisateur avec les nouvelles informations
        await updateUserInfo(response.data.user);
        Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response) {
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
        Alert.alert('Erreur réseau', 'Le serveur ne répond pas. Vérifiez votre connexion internet.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la préparation de l\'upload.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.profileImage}
      onPress={user ? handleEditPicture : onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={themeColor} />
      ) : user?.picture ? (
        <Image 
          source={{ uri: user.picture }} 
          style={styles.profilePicture}
        />
      ) : (
        <Ionicons name="person" size={40} color="#666" />
      )}
      
      {user && !loading && (
        <View style={[styles.editIconContainer, { backgroundColor: themeColor }]}>
          <Ionicons name="camera" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  }
});

export default ProfileImage;