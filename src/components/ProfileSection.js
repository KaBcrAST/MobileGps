import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoginModal from './LoginModal';

const ProfileSection = ({ isLoggedIn, onLogin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <View style={styles.profileSection}>
      <View style={styles.profileImage}>
        <Ionicons name="person" size={40} color="#666" />
      </View>
      {isLoggedIn ? (
        <>
          <Text style={styles.welcomeText}>Bonjour</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={24} color="#333" />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity onPress={() => setShowLoginModal(true)}>
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>
          <LoginModal 
            visible={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLogin={(email, password) => {
              console.log('Login attempt:', email, password);
              setShowLoginModal(false);
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