import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../LoginModal';
import SettingsModal from '../SettingsModal';
import ProfileImage from './ProfileImage';
import UserInfoDisplay from './UserInfoDisplay';
import EditEmailModal from './EditEmailModal';
import useProfileRefresh from '../../hooks/useProfileRefresh';

const THEME_COLOR = 'rgb(74, 58, 255)';

const ProfileSection = ({ themeColor = THEME_COLOR }) => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  
  const { refreshing, silentRefresh } = useProfileRefresh();

  const handleEditEmailPress = () => {
    if (user?.email) {
      setNewEmail(user.email);
      setShowEditEmail(true);
    }
  };
  
  return (
    <View style={styles.profileSection}>
      <ProfileImage 
        user={user}
        onPress={user ? undefined : () => setShowLogin(true)}
        themeColor={themeColor}
      />
      
      {user ? (
        <>
          <UserInfoDisplay 
            user={user} 
            onEmailPress={handleEditEmailPress}
            themeColor={themeColor}
          />
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings" size={24} color="#333" />
          </TouchableOpacity>
          
          <SettingsModal 
            visible={showSettings}
            onClose={() => setShowSettings(false)}
            themeColor={themeColor}
          />
        </>
      ) : (
        <>
          <TouchableOpacity onPress={() => setShowLogin(true)}>
            <Text style={[styles.loginText, {color: themeColor}]}>Se connecter</Text>
          </TouchableOpacity>
          
          <LoginModal 
            visible={showLogin}
            onClose={() => setShowLogin(false)}
          />
        </>
      )}
      
      <EditEmailModal 
        visible={showEditEmail}
        onClose={() => setShowEditEmail(false)}
        email={newEmail}
        onEmailChange={setNewEmail}
        themeColor={themeColor}
      />
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
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  settingsButton: {
    padding: 10,
  }
});

export default ProfileSection;