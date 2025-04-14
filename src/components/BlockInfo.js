import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api';

const BlockInfo = ({ speed, isNavigating, location, destination, selectedRouteIndex = 0, activeRoute }) => {
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    const fetchRouteInfo = async () => {
      if (!location || !destination || !isNavigating) return;

      try {
        const response = await axios.get(`${API_URL}/navigation/info`, {
          params: {
            origin: `${location.coords.latitude},${location.coords.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            routeIndex: selectedRouteIndex // Ajout de l'index de route
          }
        });

        if (response.data) {
          setRouteInfo(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch route info:', error);
      }
    };

    fetchRouteInfo();
    // Rafraîchir les infos toutes les 30 secondes pendant la navigation
    const interval = setInterval(fetchRouteInfo, 30000);

    return () => clearInterval(interval);
  }, [location, destination, isNavigating, selectedRouteIndex]); // Ajout de selectedRouteIndex dans les dépendances

  // Utiliser activeRoute.duration ou routeInfo.duration
  const duration = activeRoute?.duration || routeInfo?.duration;
  // Utiliser activeRoute.distance ou routeInfo.distance
  const distance = activeRoute?.distance || routeInfo?.distance;

  const getArrivalTime = () => {
    if (!duration) return '--:--';
    const now = new Date();
    // Convertir la durée en minutes si nécessaire
    const durationInMinutes = typeof duration === 'string' 
      ? parseInt(duration.split(' ')[0]) 
      : duration;
    const arrivalTime = new Date(now.getTime() + (durationInMinutes * 60 * 1000));
    return arrivalTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.speedometer}>
        <Text style={styles.speedValue}>{Math.round(speed) || 0}</Text>
        <Text style={styles.speedUnit}>km/h</Text>
      </View>

      {isNavigating && (
        <View style={styles.navigationInfo}>
          <View style={styles.arrivalContainer}>
            <Icon name="clock-outline" size={24} color="#666" />
            <Text style={styles.arrivalTime}>{getArrivalTime()}</Text>
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{distance || '-- km'}</Text>
              <Text style={styles.metricLabel}>restants</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{duration || '-- min'}</Text>
              <Text style={styles.metricLabel}>restantes</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  speedometer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  speedValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  speedUnit: {
    color: '#fff',
    fontSize: 14,
  },
  navigationInfo: {
    paddingHorizontal: 20,
  },
  arrivalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  arrivalTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
  },
});

export default BlockInfo;