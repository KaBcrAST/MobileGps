import { useState, useCallback, useEffect, useRef } from 'react';

const useCameraControl = (mapRef, location, heading, isNavigating) => {
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const lastUpdateTime = useRef(0);
  const initialSetupDone = useRef(false);
  const MINIMUM_UPDATE_INTERVAL = 1000;
  
  // Réduire significativement les altitudes pour une vue plus proche
  const NAVIGATION_ALTITUDE = 100;  // Pour la vue navigation
  const NORMAL_ALTITUDE = 300;      // Réduit drastiquement pour une vue beaucoup plus basse
  
  const NAVIGATION_PITCH = 60;
  const NORMAL_PITCH = 35;          // Modifié pour une vue plus large
  
  // Nouvelle variable pour désactiver temporairement le suivi
  const disableAutoTracking = useRef(false);
  
  // Définir une configuration initiale à appliquer dès que la carte est prête
  useEffect(() => {
    // Appliquer une vue initiale dès que possible
    if (mapRef?.current && location?.coords && isCameraLocked && !initialSetupDone.current) {
      console.log('🌍 Setting initial camera position');
      
      const initialCamera = {
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: NORMAL_PITCH,
        heading: heading || 0,
        altitude: NORMAL_ALTITUDE,
        zoom: 16,
      };
      
      // Appliquer immédiatement sans animation pour l'initialisation
      try {
        mapRef.current.setCamera(initialCamera);
        console.log('📷 Initial camera set: altitude=' + NORMAL_ALTITUDE);
        initialSetupDone.current = true;
      } catch (error) {
        console.error('Failed to set initial camera:', error);
      }
    }
  }, [mapRef, location, isCameraLocked]);

  const unlockCamera = useCallback(() => {
    console.log('🔓 Camera unlocked');
    setIsCameraLocked(false);
  }, []);

  const lockCamera = useCallback(() => {
    console.log('🔒 Camera locked');
    setIsCameraLocked(true);
    // Réinitialiser immédiatement la vue
    if (location?.coords) {
      const camera = getCameraConfig(location.coords, isNavigating, heading);
      animateCameraSafely(camera, { duration: 500 });
    }
  }, [location, isNavigating, heading]);

  // Fonction utilitaire pour obtenir une configuration de caméra standard
  const getCameraConfig = useCallback((coords, navigating, currentHeading) => {
    return {
      center: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      pitch: navigating ? NAVIGATION_PITCH : NORMAL_PITCH,
      heading: currentHeading || 0,
      altitude: navigating ? NAVIGATION_ALTITUDE : NORMAL_ALTITUDE,
      zoom: navigating ? 18 : 16,
    };
  }, []);

  // Fonction pour animer la caméra avec contrôle des erreurs
  const animateCameraSafely = useCallback((camera, options = { duration: 1000 }) => {
    if (!mapRef?.current) {
      console.warn('MapRef is not available for camera animation');
      return;
    }
    
    try {
      mapRef.current.animateCamera(camera, options);
      console.log(`📷 Camera animated: altitude=${camera.altitude}, pitch=${camera.pitch}, zoom=${camera.zoom || 'default'}`);
    } catch (error) {
      console.error('Failed to animate camera:', error);
    }
  }, [mapRef]);

  // Fonction pour temporairement désactiver le suivi automatique
  const temporarilyDisableTracking = useCallback((durationMs = 5000) => {
    disableAutoTracking.current = true;
    console.log('🚫 Auto-tracking temporarily disabled');
    
    // Réactiver après la durée spécifiée
    setTimeout(() => {
      disableAutoTracking.current = false;
      console.log('✅ Auto-tracking re-enabled');
    }, durationMs);
  }, []);

  // Effet principal pour la gestion de la caméra
  useEffect(() => {
    if (!mapRef?.current || !location?.coords || !isCameraLocked || disableAutoTracking.current) {
      return;
    }

    const currentTime = Date.now();
    if (currentTime - lastUpdateTime.current < MINIMUM_UPDATE_INTERVAL) {
      return;
    }
    
    const camera = getCameraConfig(location.coords, isNavigating, heading);
    
    // Utiliser requestAnimationFrame pour s'assurer que la carte est prête
    requestAnimationFrame(() => {
      try {
        mapRef.current.animateCamera(camera, { 
          duration: initialSetupDone.current ? 1000 : 0 
        });
      } catch (err) {
        console.error('Camera animation failed:', err);
      }
    });
    
    lastUpdateTime.current = currentTime;
    initialSetupDone.current = true;
  }, [
    mapRef, 
    location?.coords?.latitude, 
    location?.coords?.longitude, 
    heading, 
    isNavigating, 
    isCameraLocked,
    getCameraConfig
  ]);

  // Fonction pour réinitialiser manuellement la vue de la caméra
  const resetCameraView = useCallback(() => {
    if (!location?.coords) return;
    
    const camera = getCameraConfig(location.coords, isNavigating, heading);
    animateCameraSafely(camera, { duration: 500 });
    console.log('🔄 Camera view reset');
  }, [location, isNavigating, heading, getCameraConfig, animateCameraSafely]);

  // Fonction pour adapter la vue à des coordonnées
  const fitToCoordinates = useCallback((coordinates, options = {}) => {
    if (!mapRef?.current || !coordinates || coordinates.length < 2) return;
    
    // Désactiver temporairement le suivi automatique
    temporarilyDisableTracking(5000);
    
    try {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: options.edgePadding || { top: 100, right: 100, bottom: 100, left: 100 },
        animated: options.animated !== false
      });
    } catch (error) {
      console.error('Failed to fit to coordinates:', error);
    }
  }, [mapRef, temporarilyDisableTracking]);

  // Fonction pour se concentrer sur un point spécifique
  const focusOnLocation = useCallback((coords, options = {}) => {
    if (!mapRef?.current || !coords) return;
    
    // Désactiver temporairement le suivi automatique
    temporarilyDisableTracking(options.trackingDisableDuration || 3000);
    
    const camera = {
      center: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      pitch: options.pitch || NORMAL_PITCH,
      heading: options.heading || heading || 0,
      altitude: options.altitude || NORMAL_ALTITUDE / 2,
      zoom: options.zoom || 17,
    };
    
    animateCameraSafely(camera, { duration: options.duration || 800 });
  }, [mapRef, heading, animateCameraSafely, temporarilyDisableTracking]);

  // Retourne les états et fonctions utiles
  return { 
    isCameraLocked, 
    unlockCamera, 
    lockCamera,
    resetCameraView,
    focusOnLocation,
    fitToCoordinates,
    temporarilyDisableTracking,
    NAVIGATION_ALTITUDE,
    NORMAL_ALTITUDE
  };
};

export default useCameraControl;