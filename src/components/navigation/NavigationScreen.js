import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Map from '../RealTimeNavigationMap';
import SpeedLimitSign from '../SpeedLimitSign';
import BlockInfo from '../BlockInfo';
import NavigationInstruction from './NavigationInstruction';
import ArrivalNotification from './ArrivalNotification';

const ARRIVAL_THRESHOLD = 50; // Distance en mètres considérée comme "arrivée"

const NavigationScreen = ({
  mapRef,
  location,
  destination,
  heading,
  activeRoute,
  isCameraLocked,
  speed,
  routeInfo,
  onEndNavigation
}) => {
  const [showArrival, setShowArrival] = useState(false);
  const [hasShownArrival, setHasShownArrival] = useState(false);

  // Vérifier si l'utilisateur est arrivé à destination
  useEffect(() => {
    if (!location?.coords || !destination || hasShownArrival) return;

    // Calculer la distance entre la position actuelle et la destination
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3; // Rayon de la terre en mètres
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
              
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance en mètres
    };

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      destination.latitude,
      destination.longitude
    );

    // Si la distance est inférieure au seuil, considérer que l'utilisateur est arrivé
    if (distance <= ARRIVAL_THRESHOLD) {
      setShowArrival(true);
      setHasShownArrival(true);
    }
  }, [location, destination, hasShownArrival]);

  // Mise à jour de la caméra
  useEffect(() => {
    // Cherchez ici des mises à jour de caméra basées sur la position
    if (mapRef?.current && location?.coords) {
      // ...
    }
  }, [location]);

  // Gérer la redirection vers l'écran d'accueil
  const handleReturnToHome = () => {
    setShowArrival(false);
    onEndNavigation();
  };

  // Gérer la fermeture de la notification sans quitter la navigation
  const handleCloseNotification = () => {
    setShowArrival(false);
  };

  return (
    <View style={styles.container}>
      <Map
        mapRef={mapRef}
        location={location}
        destination={destination}
        heading={heading}
        isNavigating={true}
        activeRoute={activeRoute}
        followsUserLocation={isCameraLocked}
      />

      <NavigationInstruction 
        location={location}
        destination={destination}
      />

      {/* Infos de vitesse et limite */}
      <View style={styles.infoContainer}>
        <BlockInfo 
          speed={speed}
          isNavigating={true}
          routeInfo={routeInfo}
          activeRoute={activeRoute}
          onEndNavigation={onEndNavigation}
        />
        <SpeedLimitSign location={location} />
      </View>

      {/* Infos de trafic */}
      {activeRoute?.traffic?.hasSlowdowns && (
        <View style={styles.trafficAlertContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF8800" />
          <Text style={styles.trafficAlertText}>
            Ralentissements: +{activeRoute.traffic.slowdownDuration.text}
          </Text>
        </View>
      )}

      {/* Notification d'arrivée */}
      <ArrivalNotification 
        visible={showArrival}
        destinationName={destination?.name || "Destination"}
        onClose={handleCloseNotification}
        onReturnToHomeScreen={handleReturnToHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  trafficAlertContainer: {
    position: 'absolute',
    top: 120, // Ajustez selon votre layout
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 248, 224, 0.9)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trafficAlertText: {
    color: '#FF8800',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default NavigationScreen;