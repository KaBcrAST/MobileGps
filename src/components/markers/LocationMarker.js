import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Platform, View } from 'react-native';
import { Marker } from 'react-native-maps';

const LocationMarker = ({ location, heading }) => {
  // État pour détecter les erreurs de chargement d'image
  const [imageError, setImageError] = useState(false);
  // État pour gérer le rendu conditionnel basé sur la plateforme
  const [isAndroid] = useState(Platform.OS === 'android');
  
  if (!location || !location.coords) return null;

  // Sur Android, au lieu d'utiliser l'icône directement dans le marqueur,
  // on va essayer une approche avec un composant Image
  if (isAndroid) {
    return (
      <Marker
        coordinate={location.coords}
        anchor={{ x: 0.5, y: 0.5 }}
        rotation={heading || 0}
        flat
      >
        <Image 
          source={require('../../../assets/navigation.png')} 
          style={styles.androidImage}
          resizeMode="contain"
          fadeDuration={0}
        />
      </Marker>
    );
  }

  // Sur iOS, on garde l'approche standard
  return (
    <Marker
      coordinate={location.coords}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading || 0}
      flat
    >
      {imageError ? (
        // Marqueur de secours en cas d'erreur de chargement d'image
        <View style={styles.basicMarker}>
          <View style={styles.arrowMarker} />
        </View>
      ) : (
        // Utiliser l'image sur iOS
        <Image 
          source={require('../../../assets/navigation.png')} 
          style={styles.arrowImage} 
          onError={() => setImageError(true)}
          fadeDuration={0}
        />
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  arrowImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain'
  },
  // Image spécifique pour Android avec dimensions contrôlées
  androidImage: {
    width: 30,
    height: 30,
  },
  // Styles de secours en cas d'erreur
  basicMarker: {
    width: 40,
    height: 40,
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  arrowMarker: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#000000',
    transform: [{ rotate: '180deg' }],
    marginTop: -4,
  }
});

export default LocationMarker;