import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Marker } from 'react-native-maps';

const LocationMarker = ({ location, heading, mapRef }) => {
  if (!location) return null;

  return (
    <Marker 
      coordinate={location.coords} 
      flat 
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading}
      zIndex={1000}
      tracksViewChanges={false}
    >
      <Image 
        source={require('../../../assets/navigation.png')} // Assurez-vous d'avoir cette image
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