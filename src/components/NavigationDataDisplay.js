import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NavigationDataDisplay = ({ route }) => {
  console.log('NavigationDataDisplay received route:', route);

  if (!route?.legs?.[0]) {
    console.log('No route data available');
    return null;
  }
  
  const minutes = Math.round(route.legs[0].duration.value / 60);
  const distance = (route.legs[0].distance.value / 1000).toFixed(1);
  
  return (
    <View style={styles.container}>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 150, // Position above white bar
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  innerContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 10,
  },
  separator: {
    fontSize: 24,
    color: '#666',
    marginHorizontal: 10,
  }
});

export default NavigationDataDisplay;