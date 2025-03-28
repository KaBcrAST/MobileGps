import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api';

const BlockInfo = ({ 
  speed, 
  location, 
  destination, 
  isNavigating,
  selectedRoute,
  avoidTolls,
  routeInfo: providedRouteInfo // Add this to accept route info from parent
}) => {
  const [localRouteInfo, setLocalRouteInfo] = useState(null);
  
  // Use provided route info if available, otherwise use local state
  const routeInfo = providedRouteInfo || localRouteInfo;

  const getArrivalTime = (durationInSeconds) => {
    if (!durationInSeconds) return '--:--';
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + durationInSeconds * 1000);
    return arrivalTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchRouteInfo = async () => {
      // Only fetch if we're navigating and don't have provided route info
      if (!location?.coords || !destination || !isNavigating || providedRouteInfo) {
        return;
      }

      try {
        const origin = `${location.coords.latitude},${location.coords.longitude}`;
        const dest = `${destination.latitude},${destination.longitude}`;

        console.log('📍 Fetching route info:', { 
          origin, 
          dest, 
          avoidTolls,
          selectedRoute 
        });

        const response = await axios.get(`${API_URL}/info`, {
          params: {
            origin,
            destination: dest,
            avoid: avoidTolls ? 'tolls' : undefined,
            routeIndex: selectedRoute
          },
          timeout: 5000
        });

        console.log('✅ Route info response:', response.data);

        if (response.data?.distance?.value && response.data?.duration?.value) {
          setLocalRouteInfo(response.data);
        } else {
          console.error('❌ Invalid route info format:', response.data);
        }
      } catch (error) {
        console.error('❌ Error fetching route info:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    };

    fetchRouteInfo();
    const interval = setInterval(fetchRouteInfo, 30000);
    return () => clearInterval(interval);
  }, [location, destination, isNavigating, selectedRoute, avoidTolls, providedRouteInfo]);

  const renderRouteInfo = () => {
    if (!routeInfo?.distance?.value || !routeInfo?.duration?.value) {
      return null;
    }

    return (
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
              {Math.floor(routeInfo.duration.value / 60)}
            </Text>
            <Text style={styles.unitLabel}>min</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <>
      <View style={styles.speedMeter}>
        <View style={styles.speedContainer}>
          <Text style={styles.speedText}>{Math.round(speed) || 0}</Text>
          <Text style={styles.unitText}>km/h</Text>
        </View>
      </View>

      <View style={styles.whiteBar}>
        <View style={styles.barContent}>
          {isNavigating && renderRouteInfo()}
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