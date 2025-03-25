import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api';

const BlockInfo = ({ speed, location, destination, isNavigating }) => {
  const [routeInfo, setRouteInfo] = useState(null);

  const getArrivalTime = (durationInSeconds) => {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + durationInSeconds * 1000);
    return arrivalTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchRouteInfo = async () => {
      if (!location?.coords || !destination || !isNavigating) {
        return;
      }

      try {
        const origin = `${location.coords.latitude},${location.coords.longitude}`;
        const dest = `${destination.latitude},${destination.longitude}`;

        const response = await axios.get(`${API_URL}/route-info`, {
          params: {
            origin,
            destination: dest
          }
        });

        if (response.data) {
          setRouteInfo(response.data);
        }
      } catch (error) {
        console.error('Error fetching route info:', error);
      }
    };

    fetchRouteInfo();
    const interval = setInterval(fetchRouteInfo, 30000);
    return () => clearInterval(interval);
  }, [location, destination, isNavigating]);

  return (
    <>
      <View style={styles.speedMeter}>
        <View style={styles.speedContainer}>
          <Text style={styles.speedText}>{Math.round(speed)}</Text>
          <Text style={styles.unitText}>km/h</Text>
        </View>
      </View>

      <View style={styles.whiteBar}>
        <View style={styles.barContent}>
          {isNavigating && routeInfo && (
            <>
              <Text style={styles.arrivalText}>
                {getArrivalTime(routeInfo.duration.value)}
              </Text>
              <View style={styles.infoWrapper}>
                <View style={styles.infoContainer}>
                  <Text style={styles.metricText}>
                    {(routeInfo.distance.value / 1000).toFixed(1)}
                  </Text>
                  <Text style={styles.unitLabel}>km</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.metricText}>
                    {routeInfo.duration.value / 60 | 0}
                  </Text>
                  <Text style={styles.unitLabel}>min</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  speedMeter: {
    position: 'absolute',
    bottom: 80, // Increased from 70 to lift it higher
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Lower z-index so it appears behind the white bar
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -5, // Slight adjustment to center text in visible part
  },
  speedText: {
    color: 'white',
    fontSize: 36, // Reduced font size
    fontWeight: 'bold',
    marginRight: 3,
  },
  unitText: {
    color: 'white',
    fontSize: 14, // Reduced font size
    marginTop: -3,
  },
  whiteBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 2, // Higher z-index to appear above speed meter
    elevation: 3, // For Android shadow effect
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  arrivalText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#000000',
    fontSize: 40,
    fontWeight: 'bold',
    zIndex: 1,
  },
  infoWrapper: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 'auto',
    zIndex: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '500',
    marginRight: 4,
  },
  unitLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '400',
  }
});

export default BlockInfo;