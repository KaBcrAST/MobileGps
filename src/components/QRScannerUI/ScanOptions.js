import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

const ScanOptions = ({ onTakePicture, onPickImage, isProcessing }) => {
  
  const handleTakePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "Vous devez autoriser l'accès à la caméra pour prendre des photos.");
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        onTakePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de prendre la photo: " + error.message);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "Vous devez autoriser l'accès à la galerie pour choisir des photos.");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        onPickImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image: " + error.message);
    }
  };

  return (
    <View style={styles.scanOptions}>
      <TouchableOpacity 
        style={[styles.scanOption, styles.cameraOption, isProcessing && styles.disabledButton]} 
        onPress={handleTakePicture}
        disabled={isProcessing}
      >
        <Ionicons name="camera" size={28} color="#fff" />
        <Text style={styles.scanOptionText}>Prendre une photo</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.scanOption, styles.galleryOption, isProcessing && styles.disabledButton]} 
        onPress={handlePickImage}
        disabled={isProcessing}
      >
        <Ionicons name="images" size={28} color="#fff" />
        <Text style={styles.scanOptionText}>Choisir une image</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  scanOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scanOption: {
    flex: 1,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cameraOption: {
    backgroundColor: '#2196F3',
  },
  galleryOption: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.6,
  },
  scanOptionText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ScanOptions;