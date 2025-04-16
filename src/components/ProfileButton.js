import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import LoginModal from './LoginModal';

const ProfileButton = () => {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => user ? logout() : setShowLogin(true)}
      >
        <Ionicons name="person" size={24} color="#000" />
        <Text style={styles.text}>
          {user ? user.name : 'Se connecter'}
        </Text>
      </TouchableOpacity>

      <LoginModal 
        visible={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  text: {
    marginLeft: 10,
    fontSize: 16,
  }
});

export default ProfileButton;