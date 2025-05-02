import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

const LocationMarker = ({ location, heading, mapRef }) => {
  if (!location) return null;

  useEffect(() => {
    if (mapRef?.current && heading !== null) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: heading,
        pitch: 60,
        altitude: 500,
        duration: 1000
      });
    }
  }, [heading, location.coords]);

  return (
    <Marker 
      coordinate={location.coords} 
      flat 
      anchor={{ x: 0.5, y: 0.5 }} 
      rotation={heading}
      zIndex={1000}
    >
      <View style={styles.userLocationDot}>
        <View style={styles.innerDot} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  userLocationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    borderWidth: 2,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center'
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db'
  }
});

export default LocationMarker;