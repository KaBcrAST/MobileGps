import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Map from '../RealTimeNavigationMap';
import SpeedLimitSign from '../SpeedLimitSign';
import BlockInfo from '../BlockInfo';
import NavigationInstruction from './NavigationInstruction';
//pt
const NavigationScreen = ({
  mapRef,
  location,
  destination,
  heading,
  activeRoute,
  isCameraLocked,
  speed,
  routeInfo,
  onEndNavigation
}) => {
  useEffect(() => {
    // Cherchez ici des mises à jour de caméra basées sur la position
    if (mapRef?.current && location?.coords) {
      // ...
    }
  }, [location]);

  return (
    <View style={styles.container}>
      <Map
        mapRef={mapRef}
        location={location}
        destination={destination}
        heading={heading}
        isNavigating={true}
        activeRoute={activeRoute}
        followsUserLocation={isCameraLocked}
      />

      <NavigationInstruction 
        location={location}
        destination={destination}
      />

      {/* Infos de vitesse et limite */}
      <View style={styles.infoContainer}>
        <BlockInfo 
          speed={speed}
          isNavigating={true}
          routeInfo={routeInfo}
          activeRoute={activeRoute}
        />
        <SpeedLimitSign location={location} />
      </View>

      {/* Bouton Terminer */}
      <TouchableOpacity 
        style={styles.endButton}
        onPress={onEndNavigation}
      >
        <Icon name="close" size={24} color="white" />
        <Text style={styles.buttonText}>Terminer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%'
  },
  endButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default NavigationScreen;