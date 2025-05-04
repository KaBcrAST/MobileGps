import React, { useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Map from './MapDisplay';
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
  const { location, speed } = useLocation(mapRef);
  const { 
    destination, 
    setDestination, 
    routeInfo, 
    setRouteInfo,
    isNavigating, 
    startNavigation, 
    heading,
    routes,
    selectedRoute,
    setActiveRoute,
    showRoutes,
    setShowRoutes,
    unlockCamera,
    isCameraLocked,
    handlePlaceSelect,
    handleRouteSelect,
    isLoading
  } = useNavigationLogic(location, mapRef);

  const handleStartNavigation = () => {
    if (!routes?.[selectedRoute]) return;
    setActiveRoute(routes[selectedRoute]);
    setShowRoutes(false);
    unlockCamera();
    startNavigation();
  };

  return (
    <View style={styles.container}>
      
      
      
      
      {isNavigating && routeInfo && (
        <NavigationStats 
          distance={routeInfo.distance?.value / 1000}
          duration={Math.round(routeInfo.duration?.value / 60)}
          isNavigating={isNavigating}
          location={location}
          destination={destination}
        />
      )}
      {isNavigating && <StatsBlock routeInfo={routeInfo} style={styles.statsBlock} />}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}
      {showRoutes && routes?.length > 0 && (
        <RouteSelection
          origin={location?.coords}
          destination={destination}
          onRouteSelect={handleRouteSelect}
          onStartNavigation={handleStartNavigation}
        />
      )}
      {selectedRoute !== null && routes?.[selectedRoute] && (
        <NavigationDataDisplay route={routes[selectedRoute]} style={styles.navigationData} />
      )}
    </View>
  );
}