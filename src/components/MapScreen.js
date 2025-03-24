import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import RouteSelection from '../components/RouteSelection';
import SpeedDisplay from '../components/SpeedDisplay';
import NavigationStats from '../components/NavigationStats';
import FloatingMenu from '../components/FloatingMenu';
import useLocation from '../hooks/useLocation';
import useNavigationLogic from '../hooks/useNavigationLogic';
import useCameraControl from '../hooks/useCameraControl';
import styles from '../styles/globalStyles';
import StatsBlock from '../components/StatsBlock';
import NavigationDataDisplay from './NavigationDataDisplay';

export default function MapScreen() {
  const mapRef = useRef(null);
  const { location, region, speed } = useLocation(mapRef);
  const { 
    destination, 
    setDestination, 
    routeInfo, 
    setRouteInfo,
    isNavigating, 
    startNavigation, 
    stopNavigation, 
    heading 
  } = useNavigationLogic(location, mapRef);

  const handleStartNavigation = () => {
    const selectedRouteData = routes[selectedRoute];
    setActiveRoute(selectedRouteData);
    setShowRoutes(false);
    unlockCamera(); // Now this will work
    startNavigation();
  };

  console.log('routeInfo:', routeInfo); // Debug log
  console.log('isNavigating:', isNavigating); // Debug log

  return (
    <View style={styles.container}>
      <Map
        mapRef={mapRef}
        location={location}
        destination={destination}
        heading={heading}
        isNavigating={isNavigating}
        activeRoute={activeRoute}
        setRouteInfo={setRouteInfo}
        setNextStep={setNextStep}
        followsUserLocation={isCameraLocked}
      />

      <SearchBar onPlaceSelect={handlePlaceSelect} />
      <SpeedDisplay 
        speed={speed}
        location={location}
        destination={destination}
        isNavigating={isNavigating}
      />
      <FloatingMenu />
      
      {isNavigating && routeInfo && (
        <NavigationStats 
          distance={routeInfo.distance?.value / 1000}
          duration={Math.round(routeInfo.duration?.value / 60)}
          isNavigating={isNavigating}
          location={location}
          destination={destination}
        />
      )}

      {isNavigating && (
        <StatsBlock 
          routeInfo={routeInfo}
          style={{
            position: 'absolute',
            top: '40%',
            alignSelf: 'center',
            backgroundColor: '#FFFFFF',
            padding: 20,
            borderRadius: 15,
            minWidth: 200,
            elevation: 5,
            zIndex: 1000
          }}
        />
      )}

      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}

      {showRoutes && routes.length > 0 && (
        <RouteSelection
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteSelect={handleRouteSelect}
          onStartNavigation={handleStartNavigation}
        />
      )}

      {selectedRoute !== null && routes?.[selectedRoute] && (
        <NavigationDataDisplay 
          route={routes[selectedRoute]} 
          style={{ zIndex: 9999 }}
        />
      )}
    </View>
  );
}