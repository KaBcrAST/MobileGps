import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Text, Keyboard, PermissionsAndroid, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import BurgerMenu from '../components/BurgerMenu';
import BottomMenu from '../components/BottomMenu';

const MapScreen = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [region, setRegion] = useState({
    latitude: 46.603354, // Latitude de la France
    longitude: 1.888334, // Longitude de la France
    latitudeDelta: 5.0, // Ajuster le zoom
    longitudeDelta: 5.0, // Ajuster le zoom
  });

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message: 'Cette application a besoin de votre permission pour accéder à votre localisation.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            (position) => {
              setRegion({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
            },
            (error) => {
              console.log(error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        }
      } else {
        Geolocation.requestAuthorization();
        Geolocation.getCurrentPosition(
          (position) => {
            setRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          },
          (error) => {
            console.log(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    };

    requestLocationPermission();
  }, []);

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Menu button pressed');
  };

  const handleExpand = (expanded) => {
    setIsExpanded(expanded);
  };

  const handleBackPress = () => {
    Keyboard.dismiss(); // Fermer le clavier
    setIsExpanded(false);
  };

  return (
    <View style={styles.container}>
      {isExpanded ? (
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      ) : (
        <BurgerMenu onPress={handleMenuPress} />
      )}
      <MapView
        style={[styles.map, isExpanded && styles.mapHidden]}
        provider={PROVIDER_GOOGLE} // Utiliser Google Maps
        region={region}
        onRegionChangeComplete={setRegion}
      />
      <BottomMenu onExpand={handleExpand} isExpanded={isExpanded} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapHidden: {
    height: 0,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000',
  },
});

export default MapScreen;