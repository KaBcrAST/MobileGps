import React, { useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Map from './RealTimeNavigationMap';
import SearchBar from './SearchBar';
import RouteSelection from '../components/RouteSelection';
import BlockInfo from './BlockInfo';
import NavigationStats from '../components/NavigationStats';
import FloatingMenu from './FloatingMenu';
import useLocation from '../hooks/useLocation';
import useNavigationLogic from '../hooks/useNavigationLogic';
import styles from '../styles/globalStyles';
import StatsBlock from '../components/StatsBlock';
import NavigationDataDisplay from './NavigationDataDisplay';

export default function MapScreen() {
  const mapRef = useRef(null);
  const { location, speed } = useLocation(mapRef); // Supprimé region car non utilisé
  const { 
    destination, 
    setDestination, 
    routeInfo, 
    setRouteInfo,
    isNavigating, 
    startNavigation, 
    heading 
  } = useNavigationLogic(location, mapRef); // Supprimé stopNavigation car non utilisé

  const handleStartNavigation = () => {
    const selectedRouteData = routes[selectedRoute];
    setActiveRoute(selectedRouteData);
    setShowRoutes(false);
    unlockCamera();
    startNavigation();
  };

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
        followsUserLocation={isCameraLocked}
      />

      <SearchBar onPlaceSelect={handlePlaceSelect} />
      <BlockInfo 
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
          style={styles.statsBlock} // Déplacé dans globalStyles
        />
      )}

      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}

      {showRoutes && routes.length > 0 && (
        <RouteSelection
          origin={location?.coords}
          destination={destination}
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