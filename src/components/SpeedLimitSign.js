import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { navigationService } from '../services/navigationService';

const SpeedLimitSign = ({ location }) => {
  const [speedLimit, setSpeedLimit] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpeedLimit = async () => {
      if (!location?.coords) {
        console.log('❌ Invalid location data');
        return;
      }

      try {
        const limit = await navigationService.getSpeedLimit(location);
        setSpeedLimit(limit);
        setError(null);
      } catch (error) {
        console.error('❌ Speed limit error:', error);
        setError('Failed to fetch');
      }
    };

    if (location?.coords) {
      fetchSpeedLimit();
    }
  }, [location]);

  // Don't render if no valid data
  if (!location?.coords || error) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sign}>
        <Text style={styles.speedLimit}>{speedLimit || '--'}</Text>
        <Text style={styles.unit}>km/h</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 20,
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
  }
});

export default SpeedLimitSign;