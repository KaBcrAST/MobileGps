import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const OAuthRedirect = ({ route }) => {
  const { login } = useAuth();
  const navigation = useNavigation();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { token, user } = route.params || {};
        
        if (!token || !user) {
          setError('Données d\'authentification manquantes');
          return;
        }

        await login({ token, user });
        navigation.replace('Map');
      } catch (error) {
        setError('Erreur lors de la connexion');
      }
    };

    handleAuth();
  }, [route.params, login, navigation]);

  return (
    <View style={styles.container}>
      <Text style={[styles.text, error && styles.errorText]}>
        {error || 'Connexion en cours...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  text: {
    fontSize: 18,
    color: '#333'
  },
  errorText: {
    color: '#ff4444'
  }
});

export default OAuthRedirect;