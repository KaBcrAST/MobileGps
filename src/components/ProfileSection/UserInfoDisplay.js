import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UserInfoDisplay = ({ user, onEmailPress, themeColor }) => {
  return (
    <View style={styles.userInfoContainer}>
      <Text style={styles.welcomeText}>
        Bonjour {user.name}
      </Text>
      
      <TouchableOpacity 
        style={styles.emailContainer}
        onPress={onEmailPress}
      >
        <Text style={styles.emailText}>{user.email}</Text>
        <Ionicons name="pencil" size={16} color={themeColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  }
});

export default UserInfoDisplay;