import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import RegisterModal from './RegisterModal';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { API_URL } from '../config/config';

const LoginModal = ({ visible, onClose }) => {
  const { login } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString();
  };

  const handleClassicLogin = async () => {
    try {
      const secureFormData = {
        email: formData.email.toLowerCase().trim(),
        password: hashPassword(formData.password)
      };

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secureFormData),
      });

      const data = await response.json();

      if (data.success) {
        await login(data);
        onClose();
      } else {
        setErrors({ submit: data.message || 'Email ou mot de passe incorrect' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'Erreur de connexion au serveur' });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google OAuth...');
      
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/api/auth/google`,
        'gpsapp://auth',
        {
          showInRecents: true,
          prefersEphemeralWebBrowserSession: true
        }
      );

      console.log('OAuth Result:', {
        type: result.type,
        hasUrl: !!result.url
      });

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.search);
        
        const token = params.get('token');
        const userStr = params.get('user');

        if (!token || !userStr) {
          throw new Error('Données de connexion incomplètes');
        }

        const user = JSON.parse(decodeURIComponent(userStr));
        await login({ token, user });
        onClose();
      }
    } catch (error) {
      console.error('Google login error:', error);
      setErrors({ 
        submit: 'Erreur de connexion Google: ' + error.message 
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.title}>Connexion</Text>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Ionicons name="logo-google" size={24} color="#DB4437" />
            <Text style={styles.buttonText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
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
              placeholder="Votre mot de passe"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {errors.submit && <Text style={styles.submitError}>{errors.submit}</Text>}

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleClassicLogin}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => setShowRegister(true)}>
              <Text style={styles.registerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          <RegisterModal 
            visible={showRegister}
            onClose={() => setShowRegister(false)}
          />
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
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    color: '#4285f4',
    marginLeft: 5,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 10,
    fontSize: 14,
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
  loginButton: {
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default LoginModal;