import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SpeedLimitSign = ({ speedLimit }) => {
  console.log("SpeedLimitSign received speedLimit:", speedLimit);
  
  if (!speedLimit) return null;
  
  return (
    <View style={styles.container}>
      <View style={styles.sign}>
        <Text style={styles.speedLimit}>{speedLimit}</Text>
        <Text style={styles.unit}>km/h</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 20, // Changed to left
    zIndex: 1000,
  },
  sign: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  speedLimit: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  unit: {
    fontSize: 12,
    color: 'black',
  },
});

export default SpeedLimitSign;