import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RegisterModal from './RegisterModal';
import axios from 'axios';

const OAUTH_URL = 'https://react-gpsapi.vercel.app/auth/google';

const LoginModal = ({ visible, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Updated event subscription pattern
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('auth/success')) {
        onClose();
        onLogin();
      }
    });

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, [onLogin, onClose]);

  const handleGoogleLogin = async () => {
    try {
      const supported = await Linking.canOpenURL(OAUTH_URL);
      if (supported) {
        await Linking.openURL(OAUTH_URL);
      } else {
        console.error('URL cannot be opened:', OAUTH_URL);
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <>
      <Modal visible={visible && !showRegister} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.title}>Connexion</Text>

            {/* Email login form */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.loginButton} onPress={() => onLogin(email, password)}>
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.line} />
            </View>

            {/* Updated Google login button */}
            <TouchableOpacity 
              style={[styles.socialButton, styles.googleButton]}
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={styles.socialButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialButton, styles.phoneButton]}>
              <Ionicons name="call" size={24} color="#333" />
              <Text style={styles.socialButtonText}>Continuer avec le téléphone</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.registerLink}
              onPress={() => setShowRegister(true)}
            >
              <Text style={styles.linkText}>
                Pas encore de compte ? S'inscrire
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <RegisterModal 
        visible={visible && showRegister}
        onClose={() => {
          setShowRegister(false);
          onClose();
        }}
        onRegister={(email, username, password) => {
          console.log('Register:', { email, username, password });
          setShowRegister(false);
        }}
      />
    </>
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
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  loginButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 5,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButton: {
    backgroundColor: '#fff',
  },
  phoneButton: {
    backgroundColor: '#fff',
  },
  socialButtonText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#0000EE',
    textDecorationLine: 'underline',
  }
});

export default LoginModal;