import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import MapDisplay from '../MapDisplay';
import NavigationInstruction from './NavigationInstruction';
import BlockInfo from '../BlockInfo';
import SpeedLimitSign from '../SpeedLimitSign';
import ArrivalNotification from './ArrivalNotification';

// Seuil de distance pour notification d'arrivée (mètres)
const ARRIVAL_THRESHOLD = 50;

const NavigationView = ({
  mapRef,
  location,
  destination,
  heading,
  activeRoute,
  isCameraLocked,
  speed,
  routeInfo,
  onEndNavigation,
  mapComponentProps
}) => {
  const [showArrival, setShowArrival] = useState(false);
  const [hasShownArrival, setHasShownArrival] = useState(false);
  const initialCameraSetup = useRef(false);

  // NOUVEL EFFET pour configurer la caméra au démarrage de la navigation
  useEffect(() => {
    const setupInitialCamera = () => {
      if (!mapRef?.current || !location?.coords || initialCameraSetup.current) return;
      
      // Définir une altitude plus basse pour être proche du sol
      const LOW_ALTITUDE = 300; // Réduisez cette valeur pour être plus près du sol
      
      console.log('🔍 Configuration initiale de la caméra en navigation');
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: 60, // Augmentez l'angle d'inclinaison pour voir plus "à l'horizontale"
        altitude: LOW_ALTITUDE, // Altitude réduite
        heading: heading || 0, // Orientation selon la direction de déplacement
        zoom: 18 // Zoom plus important pour être plus près
      }, { duration: 500 });
      
      initialCameraSetup.current = true;
    };
    
    setupInitialCamera();
  }, [mapRef, location, heading]);

  // Vérifier si on est arrivé à destination
  useEffect(() => {
    if (!location?.coords || !destination || hasShownArrival) return;

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
              
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      destination.latitude,
      destination.longitude
    );

    if (distance <= ARRIVAL_THRESHOLD) {
      setShowArrival(true);
      setHasShownArrival(true);
    }
  }, [location, destination, hasShownArrival]);

  const handleReturnToHome = () => {
    setShowArrival(false);
    onEndNavigation();
  };

  const handleCloseNotification = () => {
    setShowArrival(false);
  };

  return (
    <View style={styles.container}>
      <MapDisplay
        {...mapComponentProps}
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

      {activeRoute?.traffic?.hasSlowdowns && (
        <View style={styles.trafficAlertContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF8800" />
          <Text style={styles.trafficAlertText}>
            Ralentissements: +{activeRoute.traffic.slowdownDuration.text}
          </Text>
        </View>
      )}

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
    top: 120,
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
  }
});

export default NavigationView;