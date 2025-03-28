import React, { useRef, useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import RouteSelection from '../components/RouteSelection';
import NavigationInfo from '../components/NavigationInfo';
import BlockInfo from '../components/BlockInfo';
import SpeedLimitSign from '../components/SpeedLimitSign';
import FloatingMenu from '../components/FloatingMenu';
import NavigationSettings from '../components/NavigationSettings';
import useLocation from '../hooks/useLocation';
import useNavigationLogic from '../hooks/useNavigationLogic';
import useCameraControl from '../hooks/useCameraControl';
import styles from '../styles/globalStyles';
import { navigationService, decodePolyline } from '../services/navigationService';

export default function MapScreen() {
  const mapRef = useRef(null);
  const { location, region, speed, speedLimit } = useLocation(mapRef);
  const { 
    destination, 
    setDestination, 
    routeInfo, 
    setRouteInfo,
    isNavigating,
    setIsNavigating, // Add this
    startNavigation, 
    stopNavigation, 
    heading 
  } = useNavigationLogic(location, mapRef);
  const { isCameraLocked, unlockCamera, updateCamera } = useCameraControl(mapRef);
  
  const [nextStep, setNextStep] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [showRoutes, setShowRoutes] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);

  const handlePlaceSelect = async (dest) => {
    setDestination(dest);
    if (location) {
      try {
        setIsLoading(true);
        const result = await navigationService.getRoute(
          location.coords,
          dest,
          { avoidTolls }
        );
        
        if (result.status === 'OK' && result.routes?.length > 0) {
          // No need to decode polylines here anymore as it's done in the service
          setRoutes(result.routes);
          setShowRoutes(true);
          setSelectedRoute(0);

          // Fit to bounds of the first route
          if (result.routes[0]?.coordinates?.length > 0) {
            const coords = result.routes[0].coordinates;
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { 
                top: 100,
                right: 50,
                bottom: 300,
                left: 50 
              },
              animated: true
            });
          }
        } else {
          Alert.alert('Erreur', 'Aucun itinéraire trouvé');
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
        Alert.alert('Erreur', 'Impossible de charger les itinéraires');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRouteSelect = (index) => {
    setSelectedRoute(index);
    
    // Get the selected route bounds
    const selectedRouteData = routes[index];
    if (selectedRouteData?.bounds) {
      const { northeast, southwest } = selectedRouteData.bounds;
      
      // Fit map to the selected route's bounds
      mapRef.current?.fitToCoordinates(
        [
          { latitude: northeast.lat, longitude: northeast.lng },
          { latitude: southwest.lat, longitude: southwest.lng }
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true
        }
      );
    }

    // Update route info if available
    if (selectedRouteData?.legs?.[0]) {
      const { distance, duration } = selectedRouteData.legs[0];
      setRouteInfo({
        distance,
        duration,
        summary: selectedRouteData.summary || 'Route principale'
      });
    }
  };

  const handleStartNavigation = (route) => {
    if (!route) {
      console.error('❌ No route provided to start navigation');
      return;
    }
  
    console.log('🚗 Starting navigation with route:', {
      summary: route.summary,
      distance: route.distance?.value,
      duration: route.duration?.value
    });
  
    setActiveRoute(route);
    setShowRoutes(false);
    startNavigation(); // Use this instead of setIsNavigating
  };

  const handleTollPreferenceChange = async (newValue) => {
    setAvoidTolls(newValue);
    if (location && destination) {
      try {
        setIsLoading(true);
        const result = await navigationService.getRoute(
          location.coords,
          destination,
          { avoidTolls: newValue }
        );
        
        if (result.status === 'OK' && result.routes?.length > 0) {
          setRoutes(result.routes);
          setShowRoutes(true);
        }
      } catch (error) {
        console.error('Error recalculating route:', error);
        Alert.alert('Erreur', 'Impossible de recalculer l\'itinéraire');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!region) return null;

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
      <BlockInfo 
        speed={speed}
        location={location}
        destination={destination}
        isNavigating={isNavigating}
        selectedRoute={selectedRoute}
        avoidTolls={avoidTolls}
        routeInfo={routes[selectedRoute]} // Add this line
      />
      <SpeedLimitSign location={location} />
      
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}

      {showRoutes && routes.length > 0 && (
        <RouteSelection
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteSelect={handleRouteSelect} // Simplified handler
          location={location}
          destination={destination}
          mapRef={mapRef}
          onStartNavigation={handleStartNavigation} // New handler with zoom
        />
      )}

      {isNavigating && (
        <NavigationInfo
          nextStep={nextStep}
          routeInfo={routeInfo}
        />
      )}

      <FloatingMenu 
        onTollPreferenceChange={handleTollPreferenceChange}
        avoidTolls={avoidTolls}  // Pass the state
      />
    </View>
  );
}