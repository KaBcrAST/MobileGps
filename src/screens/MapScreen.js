import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import RouteSelection from '../components/RouteSelection';
import NavigationInfo from '../components/NavigationInfo';
import BlockInfo from '../components/BlockInfo';
import SpeedLimitSign from '../components/SpeedLimitSign';
import FloatingMenu from '../components/FloatingMenu';
import useLocation from '../hooks/useLocation';
import useNavigationLogic from '../hooks/useNavigationLogic';
import useCameraControl from '../hooks/useCameraControl';
import styles from '../styles/globalStyles';

export default function MapScreen() {
  const mapRef = useRef(null);
  const { location, region, speed, speedLimit } = useLocation(mapRef);
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
  const { isCameraLocked, unlockCamera, updateCamera } = useCameraControl(mapRef);
  
  const [nextStep, setNextStep] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [showRoutes, setShowRoutes] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaceSelect = async (dest) => {
    setDestination(dest);
    if (location) {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${
            location.coords.latitude
          },${location.coords.longitude}&destination=${
            dest.latitude
          },${dest.longitude}&alternatives=true&key=AIzaSyAMthwpI5QDvhvxS-fuqVasqK3vr3U8dms`
        );
        const data = await response.json();
        
        if (data.status === 'OK' && data.routes?.length > 0) {
          setRoutes(data.routes);
          setShowRoutes(true);
          setSelectedRoute(0);

          // Adjust map view to show all routes
          const bounds = data.routes.reduce((acc, route) => {
            const { northeast, southwest } = route.bounds;
            return {
              north: Math.max(acc.north, northeast.lat),
              south: Math.min(acc.south, southwest.lat),
              east: Math.max(acc.east, northeast.lng),
              west: Math.min(acc.west, southwest.lng),
            };
          }, {
            north: -90,
            south: 90,
            east: -180,
            west: 180,
          });

          mapRef.current?.fitToCoordinates(
            [
              { latitude: bounds.north, longitude: bounds.east },
              { latitude: bounds.south, longitude: bounds.west },
            ],
            {
              edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
              animated: true,
            }
          );
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
  };

  const handleStartNavigation = () => {
    const selectedRouteData = routes[selectedRoute];
    setActiveRoute(selectedRouteData);
    setShowRoutes(false);
    unlockCamera(); // Unlock camera when starting navigation
    updateCamera(location, destination); // Update camera position
    startNavigation();
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

      <FloatingMenu />
    </View>
  );
}