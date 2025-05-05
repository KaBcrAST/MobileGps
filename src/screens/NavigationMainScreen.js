import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Map from '../components/MapDisplay';
import SearchBar from '../components/SearchBar/SearchBar';
import BlockInfo from '../components/BlockInfo';
import FloatingMenu from '../components/FloatingMenu';
import ReportMenu from '../components/ReportMenu';
import RoutePreview from '../components/RoutePreview/RoutePreview';
import useLocation from '../hooks/useLocation';
import useNavigationLogic from '../hooks/useNavigationLogic';

import globalStyles from '../styles/globalStyles';
import { addToLocalHistory } from '../services/localHistoryService';
import NavigationScreen from '../components/navigation/NavigationScreen';
import useMapCamera from '../hooks/useMapCamera';

export default function NavigationMainScreen() {
  const mapRef = useRef(null);
  const { location, region, speed } = useLocation(mapRef);
  const { 
    destination, 
    setDestination, 
    routeInfo, 
    setRouteInfo, // Ajout de setRouteInfo ici
    isNavigating,
    setIsNavigating,
    startNavigation,
    endNavigation,
    heading,
    avoidTolls,
    handleTollPreferenceChange,
    activeRoute,
    setActiveRoute
  } = useNavigationLogic(location, mapRef);
  
  const {
    isCameraLocked, 
    unlockCamera, 
    lockCamera,
    resetCameraView,
    focusOnLocation,
    fitToCoordinates,
    temporarilyDisableTracking
  } = useMapCamera(mapRef, location, heading, isNavigating);
  
  const [showRoutes, setShowRoutes] = useState(false);
  const [routes, setRoutes] = useState([]); // Ajout de routes state
  const [selectedRoute, setSelectedRoute] = useState(0);
  
  // Fonction de sélection de route
  const onRouteSelect = (route) => {
    setSelectedRoute(route.index || 0);
    if (routes && routes.length > 0) {
      setRoutes(routes.map((r, i) => ({
        ...r,
        isSelected: i === (route.index || 0)
      })));
    }
  };

  const handlePlaceSelect = async (place) => {
    try {
      // Extraire les données de destination
      const destination = place.structured_formatting 
        ? {
            name: place.structured_formatting.main_text,
            address: place.structured_formatting.secondary_text,
            latitude: place.geometry?.location?.lat,
            longitude: place.geometry?.location?.lng
          }
        : {
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude
          };

      await addToLocalHistory(destination);
      setDestination(destination);
      setShowRoutes(true);
    } catch (error) {
      console.error('Error handling place selection:', error);
    }
  };

  const handleStartNavigation = (selectedRoute) => {
    try {
      if (!selectedRoute) return;
      
      setActiveRoute(selectedRoute);
      setIsNavigating(true);
      setShowRoutes(false);
      
      if (selectedRoute.coordinates && fitToCoordinates) {
        fitToCoordinates(selectedRoute.coordinates, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 100,
            left: 50
          },
          animated: true
        });
      }
    } catch (error) {
      console.warn('Error starting navigation:', error);
    }
  };

  if (!region) return null;

  return (
    <View style={styles.container}>
      {isNavigating ? (
        <NavigationScreen
          mapRef={mapRef}
          location={location}
          destination={destination}
          heading={heading}
          activeRoute={activeRoute}
          isCameraLocked={isCameraLocked}
          speed={speed}
          routeInfo={routeInfo}
          onEndNavigation={endNavigation}
        />
      ) : (
        <>
          <Map
            mapRef={mapRef}
            location={location}
            destination={destination}
            heading={heading}
            isNavigating={isNavigating}
            activeRoute={activeRoute}
            setRouteInfo={setRouteInfo} // Maintenant définie
            showRoutes={showRoutes}
            routes={routes}
            selectedRoute={selectedRoute}
            onRouteSelect={onRouteSelect}
            followsUserLocation={false}
            isCameraLocked={isCameraLocked}
            temporarilyDisableTracking={temporarilyDisableTracking}
          />
          
          {showRoutes && (
            <RoutePreview
              origin={location?.coords}
              destination={destination}
              onRouteSelect={(route) => {
                setSelectedRoute(route.index || 0);
                onRouteSelect(route);
                // Mettre à jour routes quand on récupère de nouveaux itinéraires
                if (route.routes) {
                  setRoutes(route.routes);
                }
              }}
              onStartNavigation={handleStartNavigation}
              avoidTolls={avoidTolls}
              mapRef={mapRef}
              fitToCoordinates={fitToCoordinates}
              temporarilyDisableTracking={temporarilyDisableTracking}
            />
          )}
          
          <SearchBar onPlaceSelect={handlePlaceSelect} />
          <BlockInfo 
            speed={speed}
            isNavigating={false}
            routeInfo={routeInfo}
          />
        </>
      )}
      
      <FloatingMenu 
        style={styles.floatingMenuStyle} // Application du style personnalisé
        onTollPreferenceChange={handleTollPreferenceChange}
        avoidTolls={avoidTolls}
        onCameraLockToggle={isCameraLocked ? unlockCamera : lockCamera}
        isCameraLocked={isCameraLocked}
      />
      <ReportMenu location={location} />
    </View>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  container: {
    flex: 1,
  },
  // Ajout de ce style pour positionner FloatingMenu plus à droite
  floatingMenuStyle: {
    position: 'absolute',
    top: '8%',
    right: 20, // Position plus à droite
    zIndex: 1000,
  }
});