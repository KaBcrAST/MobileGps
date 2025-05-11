import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Speedometer = ({ speed }) => {
  return (
    <View style={styles.speedometer}>
      <Text style={styles.speedValue}>{Math.round(speed) || 0}</Text>
      <Text style={styles.speedUnit}>km/h</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  speedometer: {
    backgroundColor: 'rgb(74, 58, 255)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  speedValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  speedUnit: {
    color: '#fff',
    fontSize: 12,
    marginTop: -5,
  },
});

export default Speedometer;