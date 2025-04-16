import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import CryptoJS from 'crypto-js';

const RegisterModal = ({ visible, onClose }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validation nom
    if (!formData.name) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation email
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Veuillez entrer un email valide';
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une lettre et un chiffre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hashPassword = (password) => {
    console.log('Password before hash:', password); // Debug
    const hashedPassword = CryptoJS.SHA256(password).toString();
    console.log('Password after hash:', hashedPassword); // Debug
    return hashedPassword;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      // On crée un nouvel objet avec le mot de passe hashé
      const secureFormData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: hashPassword(formData.password) // Hash le mot de passe avant envoi
      };

      console.log('Sending secure data...'); // Pour debug

      const response = await fetch('https://react-gpsapi.vercel.app/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secureFormData),
      });

      const data = await response.json();
      console.log('Server response:', data); // Pour debug

      if (data.success) {
        await login(data);
        onClose();
      } else {
        setErrors({ submit: data.message || 'Erreur lors de l\'inscription' });
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrors({ submit: 'Erreur de connexion au serveur' });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ex: Jean Dupont"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="exemple@email.com"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Minimum 6 caractères"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {errors.submit && <Text style={styles.submitError}>{errors.submit}</Text>}

          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
  },
  submitError: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  registerButton: {
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterModal;