import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const OAuthRedirect = ({ route }) => {
  const { login } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Récupérer les données de l'URL
        const params = route.params;
        if (params?.token && params?.user) {
          // Connecter l'utilisateur avec les données reçues
          await login({
            token: params.token,
            user: params.user
          });
          
          // Rediriger vers la carte
          navigation.replace('Map');
        }
      } catch (error) {
        console.error('OAuth redirect error:', error);
      }
    };

    handleAuth();
  }, [route.params, login, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Connexion en cours...</Text>
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
  }
});

export default OAuthRedirect;