import React, { useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Map from '../../components/RealTimeNavigationMap';
import SearchBar from '../../components/SearchBar';
import NavigationInfo from '../../components/NavigationInfo';
import BlockInfo from '../../components/BlockInfo';
import SpeedLimitSign from '../../components/SpeedLimitSign';
import FloatingMenu from '../../components/FloatingMenu';
import ReportMenu from '../../components/ReportMenu';
import RoutePreview from '../../components/RoutePreview/RoutePreview';
import useLocation from '../../hooks/useLocation';
import useNavigationLogic from '../../hooks/useNavigationLogic';
import useCameraControl from '../../hooks/useCameraControl';
import globalStyles from '../../styles/globalStyles';
import { navigationService } from '../../services/navigationService';
import DestinationHistory from '../../components/DestinationHistory';
import { addToHistory } from '../../services/historyService';
import { useAuth } from '../../contexts/AuthContext';
import { addToLocalHistory } from '../../services/localHistoryService';

export default function MapScreen() {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const { location, region, speed } = useLocation(mapRef);
  const { 
    destination, 
    setDestination, 
    routeInfo, 
    setRouteInfo,
    isNavigating,
    setIsNavigating,
    startNavigation,
    endNavigation,
    heading
  } = useNavigationLogic(location, mapRef);

  const { 
    isCameraLocked, 
    unlockCamera, 
    lockCamera 
  } = useCameraControl(mapRef, location, heading, isNavigating);
  
  const [nextStep, setNextStep] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [showRoutes, setShowRoutes] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update toggle function to use unlockCamera from hook
  const toggleCameraLock = useCallback(() => {
    if (isCameraLocked) {
      unlockCamera();
    } else {
      lockCamera();
    }
  }, [isCameraLocked, unlockCamera, lockCamera]);

  const handlePlaceSelect = async (place) => {
    try {
      // Log pour voir la structure complète de l'objet place
      console.log('Selected place full data:', place);

      // On vérifie si on reçoit les données de l'autocomplétion Google
      if (place.structured_formatting) {
        const destination = {
          name: place.structured_formatting.main_text,
          address: place.structured_formatting.secondary_text,
          latitude: place.geometry?.location?.lat,
          longitude: place.geometry?.location?.lng
        };

        console.log('Saving to history:', destination);
        await addToLocalHistory(destination);
        setDestination(destination);
      } 
      // Si on reçoit les données depuis la sélection de l'historique
      else {
        const destination = {
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude
        };

        await addToLocalHistory(destination);
        setDestination(destination);
      }

      setShowRoutes(true);
    } catch (error) {
      console.error('Error handling place selection:', error);
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

  const handleDestinationSelect = async (selectedDestination) => {
    try {
      if (user?._id) {
        console.log('Adding to history:', selectedDestination); // Debug log
        const destinationData = {
          name: selectedDestination.name || 'Destination',
          address: selectedDestination.address || 'Adresse inconnue',
          coordinates: {
            latitude: selectedDestination.geometry?.location?.lat || selectedDestination.latitude,
            longitude: selectedDestination.geometry?.location?.lng || selectedDestination.longitude
          }
        };

        await addToHistory(user._id, destinationData);
        handlePlaceSelect(selectedDestination); // This will update the map
      }
    } catch (error) {
      console.error('Error saving destination:', error);
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
        followsUserLocation={isCameraLocked} // Pass the state here
      />
      
      {showRoutes && !isNavigating && (
        <RoutePreview
          origin={location?.coords}
          destination={destination}
          onRouteSelect={setSelectedRoute}
          onStartNavigation={handleStartNavigation}
        />
      )}
      
      <SearchBar onPlaceSelect={handlePlaceSelect} />
      <BlockInfo 
        speed={speed}
        isNavigating={isNavigating}
        routeInfo={routeInfo}
        activeRoute={activeRoute}
      />
      <SpeedLimitSign location={location} />
      
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}

      {isNavigating && (
        <View style={styles.navigationControls}>
          <NavigationInfo
            nextStep={nextStep}
            routeInfo={routeInfo}
          />
          <TouchableOpacity 
            style={styles.endNavigationButton}
            onPress={endNavigation}
          >
            <Icon name="close" size={24} color="white" />
            <Text style={styles.buttonText}>Terminer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FloatingMenu />
      <ReportMenu location={location} />
      
      {/* Only show history when not previewing routes and not navigating */}
      {!showRoutes && !isNavigating && (
        <View style={styles.historyWrapper}>
          <DestinationHistory 
            onSelectDestination={handlePlaceSelect}
            style={styles.historyContainer}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  historyWrapper: {
    position: 'absolute',
    top: 120, // Below the search bar
    left: 10,
    right: 10,
    zIndex: 2, // Make sure it's above the map
  },
  historyContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 300,
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationControls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  endNavigationButton: {
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  }
});