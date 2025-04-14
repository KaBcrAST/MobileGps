import React, { useRef, useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import NavigationInfo from '../components/NavigationInfo';
import BlockInfo from '../components/BlockInfo';
import SpeedLimitSign from '../components/SpeedLimitSign';
import FloatingMenu from '../components/FloatingMenu';
import ReportMenu from '../components/ReportMenu';
import RoutePreview from '../components/RoutePreview/RoutePreview';
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
    heading,
    avoidTolls,
    handleTollPreferenceChange 
  } = useNavigationLogic(location, mapRef);
  const { isCameraLocked, unlockCamera, updateCamera } = useCameraControl(mapRef);
  
  const [nextStep, setNextStep] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [showRoutes, setShowRoutes] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewRoutes, setPreviewRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

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

  const handleStartNavigation = (selectedRoute) => {
    console.log('Starting navigation with route:', selectedRoute);
    setActiveRoute(selectedRoute);
    setIsNavigating(true);
    setShowRoutes(false);
  };

  const handleRouteReady = (routeData) => {
    if (routeData.startNavigation) {
      // Démarrer la navigation
      setActiveRoute(routeData);
      setShowRoutes(false);
      startNavigation();
    } else {
      // Mise à jour normale des informations de route
      setRouteInfo(routeData);
      if (routeData.coordinates) {
        mapRef.current?.fitToCoordinates(routeData.coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true
        });
      }
    }
  };

  const handleRoutePreview = (routeData) => {
    if (routeData.startNavigation) {
      handleStartNavigation(routeData);
    } else {
      setPreviewRoutes(routeData.routes || []);
      setSelectedRouteIndex(routeData.selectedIndex || 0);
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
      
      {showRoutes && !isNavigating && (
        <RoutePreview
          origin={location?.coords}
          destination={destination}
          onRouteSelect={(route) => {
            setSelectedRoute(route);
          }}
          onStartNavigation={handleStartNavigation}
        />
      )}
      
      <SearchBar onPlaceSelect={handlePlaceSelect} />
      <BlockInfo 
        speed={speed}
        isNavigating={isNavigating}
        routeInfo={routeInfo} // Passer directement routeInfo
        activeRoute={activeRoute} // Ajouter activeRoute pour avoir les infos de la route sélectionnée
      />
      <SpeedLimitSign location={location} />
      
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}

      {isNavigating && (
        <NavigationInfo
          nextStep={nextStep}
          routeInfo={routeInfo}
        />
      )}

      <FloatingMenu 
        onTollPreferenceChange={handleTollPreferenceChange}
        avoidTolls={avoidTolls}
      />

      <ReportMenu location={location} />
    </View>
  );
}