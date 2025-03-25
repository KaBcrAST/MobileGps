import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api';

const SpeedLimitSign = ({ location }) => {
  const [speedLimit, setSpeedLimit] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpeedLimit = async () => {
      // Check if we have valid location data
      if (!location?.coords?.latitude || !location?.coords?.longitude) {
        console.log('❌ Invalid location data');
        return;
      }

      const { latitude, longitude } = location.coords;
      
      // Log current location data
      console.log('📍 Fetching speed limit for:', {
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
        accuracy: location.coords.accuracy,
        speed: location.coords.speed
      });

      try {
        const response = await axios.get(`${API_URL}/speed-limit`, {
          params: { 
            latitude,
            longitude,
            accuracy: location.coords.accuracy
          }
        });

        console.log('✅ Speed limit response:', response.data);
        
        if (response.data?.speedLimit) {
          setSpeedLimit(response.data.speedLimit);
          setError(null);
        }
      } catch (error) {
        console.error('❌ Speed limit error:', error);
        setError('Failed to fetch');
      }
    };

    // Only fetch if we have location data
    if (location?.coords) {
      fetchSpeedLimit();
    }
  }, [location]); // Re-run when location changes

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