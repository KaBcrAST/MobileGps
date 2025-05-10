import { useCallback } from 'react';

/**
 * Hook pour gérer les contrôles de navigation
 */
const useNavigationController = ({
  mapRef,
  location,
  heading,
  endNavigation,
  handleEndNavigation, // This might be undefined
  NORMAL_ALTITUDE
}) => {
  const setupNavigationCamera = useCallback((altitude = 300) => {
    if (!mapRef?.current || !location?.coords) return;
    
    setTimeout(() => {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: 60,
        altitude: altitude,
        heading: heading || 0,
        zoom: 18
      }, { duration: 300 });
    }, 100);
  }, [mapRef, location, heading]);

  const handleStartNavigation = useCallback((selectedRoute) => {
    try {
      if (!selectedRoute) return null;
      
      // On configurera la caméra pour le mode navigation
      if (mapRef.current && location?.coords) {
        setupNavigationCamera();
      }
      
      return selectedRoute;
    } catch (error) {
      console.warn('Error preparing navigation:', error);
      return null;
    }
  }, [mapRef, location, setupNavigationCamera]);

  const handleEndNavigationComplete = useCallback(() => {
    // Arrêter la navigation
    endNavigation();
    
    // Réinitialiser la vue de la caméra - check if handleEndNavigation exists first
    if (typeof handleEndNavigation === 'function') {
      handleEndNavigation();
    } else {
      // Fallback if handleEndNavigation is not provided
      if (mapRef.current && location?.coords) {
        mapRef.current.animateCamera({
          center: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          pitch: 45,
          altitude: NORMAL_ALTITUDE || 600,
          heading: heading || 0,
          zoom: 17
        }, { duration: 500 });
      }
    }
  }, [mapRef, location, heading, endNavigation, handleEndNavigation, NORMAL_ALTITUDE]);

  return {
    setupNavigationCamera,
    handleStartNavigation,
    handleEndNavigationComplete
  };
};

export default useNavigationController;