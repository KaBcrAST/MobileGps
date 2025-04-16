import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';

const ProfileSection = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  console.log('User data:', user); // Pour déboguer

  return (
    <View style={styles.profileSection}>
      <View style={styles.profileImage}>
        {user?.picture ? (
          <Image 
            source={{ uri: user.picture }} 
            style={styles.profilePicture}
          />
        ) : (
          <Ionicons name="person" size={40} color="#666" />
        )}
      </View>
      {user ? (
        <>
          <Text style={styles.welcomeText}>
            Bonjour {user.name}
          </Text>
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
            onLogin={(email, password) => {
              console.log('Login attempt:', email, password);
              setShowLogin(false);
            }}
          />
        </>
      )}
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
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  settingsButton: {
    padding: 10,
  }
});

export default ProfileSection;