import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Marker } from 'react-native-maps';

const LocationMarker = ({ location, heading }) => {
  if (!location) return null;

  return (
    <Marker 
      coordinate={location.coords} 
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading || 0}
      zIndex={1000}
      tracksViewChanges={false}
      flat={true} // Assurez-vous que ce paramètre est true pour que la rotation fonctionne
    >
      <Image 
        source={require('../../../assets/navigation.png')} 
        style={styles.arrowImage} 
      />
    </Marker>
  );
};

const styles = StyleSheet.create({
  arrowImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain'
  }
});

export default LocationMarker;