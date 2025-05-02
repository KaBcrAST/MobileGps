import { useState, useCallback, useEffect, useRef } from 'react';

// Hook principal avec fonctionnalités améliorées de style Waze/Google Maps
const useMapCamera = (mapRef, location, heading, isNavigating, { destination, coordinates } = {}) => {
  // États et références existants - inchangés
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Références pour le contrôle de la caméra
  const initialViewApplied = useRef(false);
  const lastUpdateTime = useRef(0);
  const previousPosition = useRef(null);
  const calculatedHeading = useRef(heading || 0);
  const isMovingBackward = useRef(false);
  const lastHeadings = useRef([]);
  const lastCameraUpdate = useRef(0);
  
  // Pour empêcher les mises à jour automatiques
  const blockAutoUpdates = useRef(false);
  
  // Constantes optimisées pour une expérience style Waze
  const MINIMUM_UPDATE_INTERVAL = 800;
  const DIRECTION_THRESHOLD = 0.4;
  const NAVIGATION_ALTITUDE = 30;
  const NORMAL_ALTITUDE = 100;
  const PREVIEW_ALTITUDE = 1000;
  const NAVIGATION_PITCH = 75;
  const NORMAL_PITCH = 60;
  
  // SUPPRIMÉ: const VERTICAL_OFFSET = -0.0003;
  // AJOUTÉ: Distance de décalage pour style Waze en mètres
  const OFFSET_DISTANCE = -30; // 100 mètres de décalage

  // Amélioration de la fonction offsetCoordinates pour de grands décalages
  const offsetCoordinates = useCallback((latitude, longitude, heading, distanceInMeters) => {
    // Algorithme haversine plus précis pour les grands décalages
    const earthRadius = 6378137; // Rayon moyen de la Terre en mètres
    const offsetHeading = (heading + 180) % 360; // Direction opposée
    const headingRad = offsetHeading * Math.PI / 180;
    
    // Distance angulaire
    const angularDistance = distanceInMeters / earthRadius;
    
    // Convertir en radians
    const latRad = latitude * Math.PI / 180;
    const lonRad = longitude * Math.PI / 180;
    
    // Calcul précis des nouvelles coordonnées
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(headingRad)
    );
    
    const newLonRad = lonRad + Math.atan2(
      Math.sin(headingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
    );
    
    // Conversion en degrés
    const newLat = newLatRad * 180 / Math.PI;
    const newLon = newLonRad * 180 / Math.PI;
    
    return {
      latitude: newLat,
      longitude: newLon
    };
  }, []);

  // Fonctions utilitaires existantes - inchangées
  const getDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return 0;
    
    const R = 6371e3;
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
             Math.cos(φ1) * Math.cos(φ2) *
             Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  const getBearing = useCallback((start, end) => {
    if (!start || !end) return 0;
    
    const startLat = start.latitude * Math.PI / 180;
    const startLng = start.longitude * Math.PI / 180;
    const endLat = end.latitude * Math.PI / 180;
    const endLng = end.longitude * Math.PI / 180;

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    if (bearing < 0) {
      bearing += 360;
    }
    return bearing;
  }, []);

  const animateCameraSafely = useCallback((camera, options = { duration: 1000 }) => {
    if (!mapRef?.current) return;
    
    try {
      mapRef.current.animateCamera(camera, options);
    } catch (error) {
      console.error('Failed to animate camera:', error);
    }
  }, [mapRef]);

  // MODIFIÉ: Configuration de caméra avec décalage dynamique style Waze
  const getCameraConfig = useCallback((coords, navigating, currentHeading) => {
    if (!coords) return null;
    
    const headingToUse = currentHeading || 0;
    
    return {
      // MODIFIÉ: Utiliser offsetCoordinates pour un décalage directionnel
      center: navigating
        ? offsetCoordinates(coords.latitude, coords.longitude, headingToUse, OFFSET_DISTANCE)
        : { latitude: coords.latitude, longitude: coords.longitude },
      pitch: navigating ? NAVIGATION_PITCH : NORMAL_PITCH,
      heading: headingToUse,
      altitude: navigating ? NAVIGATION_ALTITUDE : NORMAL_ALTITUDE,
      zoom: navigating ? 18 : 17,
    };
  }, [offsetCoordinates]);

  // Autres fonctions existantes - inchangées
  const temporarilyDisableTracking = useCallback((durationMs = 5000) => {
    blockAutoUpdates.current = true;
    
    // Réactiver après la durée spécifiée
    setTimeout(() => {
      blockAutoUpdates.current = false;
    }, durationMs);
  }, []);

  const findNextPoint = useCallback((currentPosition, routeCoordinates) => {
    if (!routeCoordinates || !Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return null;
    
    for (let i = 0; i < routeCoordinates.length; i++) {
      const point = routeCoordinates[i];
      const distance = getDistance(currentPosition, point);
      if (distance > 30) return point;
    }
    
    return routeCoordinates[routeCoordinates.length - 1];
  }, [getDistance]);

  // Effet de détection de la direction - inchangé
  useEffect(() => {
    if (!location?.coords || !isCameraLocked) return;

    const currentPosition = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      time: new Date().getTime(),
      speed: location.coords.speed || 0
    };

    if (previousPosition.current) {
      const timeDiff = (currentPosition.time - previousPosition.current.time) / 1000;
      if (timeDiff <= 0) {
        previousPosition.current = currentPosition;
        return;
      }

      const distance = getDistance(previousPosition.current, currentPosition);
      const speed = distance / timeDiff;

      if (speed > DIRECTION_THRESHOLD) {
        const bearing = getBearing(previousPosition.current, currentPosition);
        
        // Détection de marche arrière simplifiée
        const phoneHeading = heading ?? 0;
        const headingDiff = Math.abs((phoneHeading - bearing + 180) % 360 - 180);
        isMovingBackward.current = headingDiff > 120;

        const correctedBearing = isMovingBackward.current
          ? (bearing + 180) % 360
          : bearing;

        lastHeadings.current.push(correctedBearing);
        if (lastHeadings.current.length > 3) lastHeadings.current.shift();

        // Calculer la moyenne pour lisser
        const sumX = lastHeadings.current.reduce((sum, angle) => sum + Math.cos(angle * Math.PI / 180), 0);
        const sumY = lastHeadings.current.reduce((sum, angle) => sum + Math.sin(angle * Math.PI / 180), 0);
        const smoothedHeading = (Math.atan2(sumY, sumX) * 180 / Math.PI + 360) % 360;

        calculatedHeading.current = smoothedHeading;
      }
    }

    previousPosition.current = currentPosition;
  }, [location?.coords?.latitude, location?.coords?.longitude, heading, isCameraLocked, getDistance, getBearing]);

  // MODIFIÉ: Effet principal pour le mode navigation avec UI type Waze
  useEffect(() => {
    if (!isNavigating || !mapRef?.current || !location?.coords || !isCameraLocked || blockAutoUpdates.current) {
      return;
    }
    
    const now = Date.now();
    if (now - lastUpdateTime.current < MINIMUM_UPDATE_INTERVAL) {
      return;
    }
    
    lastUpdateTime.current = now;
    
    const nextPoint = findNextPoint(location.coords, coordinates);
    const directionToUse = nextPoint ? getBearing(location.coords, nextPoint) : (calculatedHeading.current || heading || 0);
    
    // Utiliser le décalage augmenté pour placer le point GPS très bas sur l'écran
    const offsetCenter = offsetCoordinates(
      location.coords.latitude, 
      location.coords.longitude, 
      directionToUse, 
      OFFSET_DISTANCE
    );
    
    const camera = {
      center: offsetCenter,
      pitch: NAVIGATION_PITCH,
      heading: directionToUse,
      altitude: NAVIGATION_ALTITUDE,
      zoom: 17.5 // Légèrement augmenté pour compenser
    };
    
    animateCameraSafely(camera, { duration: 800 });
    
  }, [mapRef, location?.coords?.latitude, location?.coords?.longitude, isNavigating, isCameraLocked, coordinates, heading, getBearing, findNextPoint, animateCameraSafely, offsetCoordinates]);

  // Le reste du code reste inchangé
  const forceInitialLowView = useCallback(() => {
    if (!mapRef?.current || !location?.coords) return;
    if (initialViewApplied.current) return; // Éviter les appels multiples
    
    try {
      const directionToUse = heading || calculatedHeading.current || 0;
      
      // Bloquer les mises à jour automatiques pendant l'initialisation
      blockAutoUpdates.current = true;
      
      mapRef.current.setCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: NORMAL_PITCH,
        heading: directionToUse,
        altitude: NORMAL_ALTITUDE,
        zoom: 17
      });
      
      initialViewApplied.current = true;
      
      // Débloquer après un délai
      setTimeout(() => {
        blockAutoUpdates.current = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to force initial view:', error);
      blockAutoUpdates.current = false;
    }
  }, [mapRef, location, heading]);

  useEffect(() => {
    if (mapRef?.current && location?.coords && !initialViewApplied.current) {
      const timer = setTimeout(forceInitialLowView, 500);
      return () => clearTimeout(timer);
    }
  }, [mapRef, location, forceInitialLowView]);

  const unlockCamera = useCallback(() => {
    console.log('🔓 Camera unlocked');
    setIsCameraLocked(false);
  }, []);

  const lockCamera = useCallback(() => {
    console.log('🔒 Camera locked');
    setIsCameraLocked(true);
    
    // Réinitialiser la vue avec le nouveau cap
    if (location?.coords) {
      const camera = getCameraConfig(location.coords, isNavigating, calculatedHeading.current || heading);
      animateCameraSafely(camera, { duration: 500 });
    }
  }, [location, heading, isNavigating, getCameraConfig, animateCameraSafely]);

  const resetCameraView = useCallback(() => {
    if (!location?.coords) return;
    
    const camera = getCameraConfig(location.coords, isNavigating, calculatedHeading.current || heading);
    animateCameraSafely(camera, { duration: 500 });
  }, [location, isNavigating, heading, getCameraConfig, animateCameraSafely]);

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
      heading: options.heading || calculatedHeading.current || heading || 0,
      altitude: options.altitude || NORMAL_ALTITUDE / 2,
      zoom: options.zoom || 17,
    };
    
    animateCameraSafely(camera, { duration: options.duration || 800 });
  }, [mapRef, heading, animateCameraSafely, temporarilyDisableTracking]);

  const fitToCoordinates = useCallback((coordinates, options = {}) => {
    if (!mapRef?.current || !coordinates || coordinates.length < 2) {
      return;
    }
    
    // Désactiver temporairement le suivi automatique
    temporarilyDisableTracking(options.trackingDisableDuration || 5000);
    
    try {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: options.edgePadding || { top: 100, right: 100, bottom: 100, left: 100 },
        animated: options.animated !== false
      });
    } catch (error) {
      console.error("Erreur lors de l'ajustement de la vue:", error);
    }
  }, [mapRef, temporarilyDisableTracking]);

  // Retourne les états et fonctions - fusionné avec les améliorations Waze
  return {
    isCameraLocked,
    isPreviewMode,
    unlockCamera,
    lockCamera,
    resetCameraView,
    focusOnLocation,
    forceInitialLowView,
    fitToCoordinates,
    temporarilyDisableTracking,
    NAVIGATION_ALTITUDE,
    PREVIEW_ALTITUDE,
    NORMAL_ALTITUDE
  };
};

// Export par défaut de useMapCamera
export default useMapCamera;

// Réexportation pour compatibilité avec useCameraControl
export const useCameraControl = useMapCamera;
