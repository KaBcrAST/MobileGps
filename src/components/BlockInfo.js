import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API_URL } from '../config/config';



const BlockInfo = ({ 
  speed, 
  isNavigating, 
  location, 
  destination, 
  selectedRouteIndex = 0, 
  activeRoute, 
  routeInfo 
}) => {
  const [routeDetails, setRouteDetails] = useState(null);

  useEffect(() => {
    const fetchRouteInfo = async () => {
      if (!location?.coords || !destination || !isNavigating) return;

      try {
        const response = await axios.get(`${API_URL}/navigation/info`, {
          params: {
            origin: `${location.coords.latitude},${location.coords.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            routeIndex: selectedRouteIndex
          }
        });
        setRouteDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch route info:', error);
      }
    };

    fetchRouteInfo();
    const interval = setInterval(fetchRouteInfo, 30000);
    return () => clearInterval(interval);
  }, [location, destination, isNavigating, selectedRouteIndex]);

  const duration = activeRoute?.duration || routeDetails?.duration;
  const distance = activeRoute?.distance || routeDetails?.distance;

  const getArrivalTime = useCallback(() => {
    if (!duration) return '--:--';
    const now = new Date();
    const durationInMinutes = typeof duration === 'string' 
      ? parseInt(duration.split(' ')[0]) 
      : duration;
    const arrivalTime = new Date(now.getTime() + (durationInMinutes * 60 * 1000));
    return arrivalTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [duration]);

  const formatValue = useCallback((value) => {
    if (!value) return '';
    return typeof value === 'object' && value.text ? value.text : value;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.speedometer}>
        <Text style={styles.speedValue}>{Math.round(speed) || 0}</Text>
        <Text style={styles.speedUnit}>km/h</Text>
      </View>

      {isNavigating && (
        <View style={styles.navigationInfo}>
          <View style={styles.infoRow}>
            {/* Distance à gauche */}
            <View style={styles.leftMetric}>
              <Text style={styles.metricValue}>{formatValue(distance) || '-- km'}</Text>
              <Text style={styles.metricLabel}>restants</Text>
            </View>

            {/* Heure d'arrivée au centre */}
            <View style={styles.arrivalContainer}>
              <Icon name="clock-outline" size={24} color="#666" />
              <Text style={styles.arrivalTime}>{getArrivalTime()}</Text>
            </View>

            {/* Durée à droite */}
            <View style={styles.rightMetric}>
              <Text style={styles.metricValue}>{formatValue(duration) || '-- min'}</Text>
              <Text style={styles.metricLabel}>restantes</Text>
            </View>
          </View>
        </View>
      )}

      {routeInfo && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoText}>
            {formatValue(routeInfo.distance)}
          </Text>
          <Text style={styles.routeInfoText}>
            {formatValue(routeInfo.duration)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  speedometer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    width: 80, // Réduit de 100 à 80
    height: 80, // Réduit de 100 à 80
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15, // Réduit de 20 à 15
  },
  speedValue: {
    color: '#fff',
    fontSize: 32, // Réduit de 36 à 32
    fontWeight: 'bold',
  },
  speedUnit: {
    color: '#fff',
    fontSize: 12, // Réduit de 14 à 12
  },
  navigationInfo: {
    width: '100%',
    paddingHorizontal: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  leftMetric: {
    alignItems: 'flex-start',
    flex: 1,
  },
  rightMetric: {
    alignItems: 'flex-end',
    flex: 1,
  },
  arrivalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  routeInfo: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 15, // Réduit de 20 à 15
  },
  routeInfoText: {
    fontSize: 14, // Réduit de 16 à 14
    color: '#000',
  },
});

export default BlockInfo;