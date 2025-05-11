import React, { useState } from 'react';
import { View, Modal, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config/config';

const EditEmailModal = ({ visible, onClose, email, onEmailChange, themeColor }) => {
  const { getToken, refreshUserData, updateUserInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const handleUpdateEmail = async () => {
    if (!email) {
      onClose();
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }
    
    try {
      setLoading(true);
      
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur d\'authentification', 'Veuillez vous reconnecter et réessayer.');
        return;
      }
      
      const response = await axios.put(`${API_URL}/api/profile/email`, 
        { email }, 
        { 
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        if (typeof updateUserInfo === 'function') {
          await updateUserInfo(response.data.user);
        } else {
          await refreshUserData();
        }
        
        Alert.alert('Succès', 'Adresse email mise à jour avec succès');
        onClose();
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
      } else {
        Alert.alert('Erreur', error.response?.data?.message || 'Impossible de mettre à jour l\'email. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Modifier votre email</Text>
          
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={onEmailChange}
            placeholder="Nouvel email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, { backgroundColor: themeColor }]}
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
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: 'rgb(74, 58, 255)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default EditEmailModal;