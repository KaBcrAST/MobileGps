import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SpeedLimit = ({ location }) => {
  const [speedLimit, setSpeedLimit] = useState(null);

  useEffect(() => {
    const fetchSpeedLimit = async () => {
      if (location?.coords) {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/nearest/v1/driving/${location.coords.longitude},${location.coords.latitude}?number=1`
          );
          const data = await response.json();
          if (data.waypoints?.[0]?.nodes?.[0]) {
            const nodeId = data.waypoints[0].nodes[0];
            // Second API call to get speed limit
            const speedResponse = await fetch(
              `https://overpass-api.de/api/interpreter?data=[out:json];way(around:1,${location.coords.latitude},${location.coords.longitude})[maxspeed];out bodies;`
            );
            const speedData = await speedResponse.json();
            if (speedData.elements?.[0]?.tags?.maxspeed) {
              setSpeedLimit(parseInt(speedData.elements[0].tags.maxspeed));
            }
          }
        } catch (error) {
          console.error('Error fetching speed limit:', error);
        }
      }
    };

    fetchSpeedLimit();
  }, [location]);

  return speedLimit ? (
    <View style={styles.container}>
      <Text style={styles.speedLimitText}>{speedLimit} km/h</Text>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 10,
    elevation: 5,
  },
  speedLimitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default SpeedLimit;