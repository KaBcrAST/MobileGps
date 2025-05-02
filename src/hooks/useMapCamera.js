import { useState, useCallback, useEffect, useRef } from 'react';

const useMapCamera = (mapRef, location, heading, isNavigating, { destination, coordinates } = {}) => {
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Références pour le contrôle de la caméra
  const initialViewApplied = useRef(false);
  const lastUpdateTime = useRef(0);
  const previousPosition = useRef(null);
  const calculatedHeading = useRef(heading || 0);
  const isMovingBackward = useRef(false);
  const lastHeadings = useRef([]);
  const movementHistory = useRef([]);
  const lastDirectionChange = useRef(0);
  const routeHeading = useRef(0);
  const isInitialViewSet = useRef(false);
  const lastCameraUpdate = useRef(0);
  
  // NOUVELLE RÉFÉRENCE: Pour empêcher les mises à jour automatiques
  const blockAutoUpdates = useRef(false);
  
  // Constantes
  const MINIMUM_UPDATE_INTERVAL = 1500; // Augmenté pour limiter les mises à jour
  const DIRECTION_THRESHOLD = 0.4;
  const NAVIGATION_ALTITUDE = 70;
  const NORMAL_ALTITUDE = 150;
  const PREVIEW_ALTITUDE = 10000;

  // Fonctions utilitaires (getDistance, getBearing, etc.)
  const getDistance = useCallback((point1, point2) => {
    // Votre implémentation existante...
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
    // Votre implémentation existante...
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

  // NOUVELLE FONCTION: Mise à jour contrôlée de la caméra
  const updateCamera = useCallback((params = {}, animationOptions = {}) => {
    if (!mapRef?.current || !location?.coords) return;
    
    try {
      // Bloquer les mises à jour automatiques pendant un certain temps
      blockAutoUpdates.current = true;
      setTimeout(() => { blockAutoUpdates.current = false; }, 2000);
      
      // IMPORTANT: Protéger les paramètres actuels de la caméra
      // Ne mettre à jour que ce qui est explicitement demandé
      const cameraUpdate = {
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      };
      
      // N'ajouter le heading que s'il est fourni ou disponible
      if (params.heading !== undefined || calculatedHeading.current || heading) {
        cameraUpdate.heading = params.heading !== undefined 
          ? params.heading 
          : calculatedHeading.current || heading || 0;
      }
      
      // N'ajouter ces propriétés que si elles sont explicitement fournies
      if (params.pitch !== undefined) cameraUpdate.pitch = params.pitch;
      if (params.altitude !== undefined) cameraUpdate.altitude = params.altitude;
      if (params.zoom !== undefined) cameraUpdate.zoom = params.zoom;
      
      // Options d'animation par défaut
      const finalOptions = { 
        duration: animationOptions.duration || 800
      };
      
      // Mettre à jour la dernière fois que la caméra a été modifiée
      lastCameraUpdate.current = Date.now();
      
      // Appliquer l'animation avec seulement les paramètres nécessaires
      console.log(`📸 Mise à jour caméra:`, 
        cameraUpdate.heading ? `heading=${Math.round(cameraUpdate.heading)}°` : '',
        cameraUpdate.pitch ? `pitch=${cameraUpdate.pitch}°` : '');
      
      return mapRef.current.animateCamera(cameraUpdate, finalOptions);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la caméra:', error);
    }
  }, [mapRef, location, heading]);

  // Détection de la direction de déplacement
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
        
        // Log pour débogage
        const directionEmoji = isMovingBackward.current ? "⬇️ RECUL" : "⬆️ AVANT";
        console.log(`🧭 ${directionEmoji} — Cap: ${Math.round(smoothedHeading)}° (${Math.round(speed * 3.6)} km/h)`);
      }
    }

    previousPosition.current = currentPosition;
  }, [location?.coords?.latitude, location?.coords?.longitude, heading, isCameraLocked, getDistance, getBearing]);

  // MODIFIÉ: Effet principal de mise à jour de la caméra en mode normal
  useEffect(() => {
    // DÉSACTIVER COMPLÈTEMENT les mises à jour automatiques basées sur la position GPS
    // En ajoutant un simple return, l'effet n'exécutera aucun code
    return;

    /* Code désactivé ci-dessous:
    if (!mapRef?.current || 
        !location?.coords || 
        !isCameraLocked || 
        !initialViewApplied.current || 
        isNavigating) { 
      return;
    }
    
    const now = Date.now();
    if (now - lastCameraUpdate.current < MINIMUM_UPDATE_INTERVAL) {
      return;
    }
    
    mapRef.current.animateCamera({
      center: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      heading: calculatedHeading.current || heading || 0
    }, { 
      duration: 800
    });
    
    lastCameraUpdate.current = now;
    */
    
  }, [mapRef, location?.coords?.latitude, location?.coords?.longitude, isCameraLocked, heading]);

  // MODIFIÉ: Effet pour le mode navigation
  useEffect(() => {
    if (!isNavigating || !mapRef?.current || !location?.coords || !isCameraLocked || blockAutoUpdates.current) {
      return;
    }
    
    const now = Date.now();
    if (now - lastUpdateTime.current < 800) {
      return;
    }
    
    lastUpdateTime.current = now;
    
    const nextPoint = findNextPoint(location.coords, coordinates);
    const directionToUse = nextPoint ? getBearing(location.coords, nextPoint) : (calculatedHeading.current || heading || 0);
    
    updateCamera({
      center: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      pitch: 60, // En mode navigation, on peut spécifier le pitch
      heading: directionToUse,
      altitude: NAVIGATION_ALTITUDE,
      zoom: 18
    });
    
  }, [mapRef, location?.coords?.latitude, location?.coords?.longitude, isNavigating, isCameraLocked, updateCamera]);

  // Fonction pour trouver le prochain point
  const findNextPoint = useCallback((currentPosition, routeCoordinates) => {
    if (!routeCoordinates || !Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return null;
    
    for (let i = 0; i < routeCoordinates.length; i++) {
      const point = routeCoordinates[i];
      const distance = getDistance(currentPosition, point);
      if (distance > 30) return point;
    }
    
    return routeCoordinates[routeCoordinates.length - 1];
  }, [getDistance]);

  // MODIFIÉ: Vue initiale
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
        pitch: 45,
        heading: directionToUse,
        altitude: NORMAL_ALTITUDE,
        zoom: 17
      });
      
      initialViewApplied.current = true;
      console.log('✅ INITIAL LOW VIEW APPLIED');
      
      // Débloquer après un délai
      setTimeout(() => {
        blockAutoUpdates.current = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to force low view:', error);
      blockAutoUpdates.current = false;
    }
  }, [mapRef, location, heading]);

  // Appliquer la vue initiale
  useEffect(() => {
    if (mapRef?.current && location?.coords && !initialViewApplied.current) {
      const timer = setTimeout(forceInitialLowView, 500);
      return () => clearTimeout(timer);
    }
  }, [mapRef, location, forceInitialLowView]);

  // Gestion du verrouillage de caméra
  const unlockCamera = useCallback(() => {
    console.log('🔓 Camera unlocked');
    setIsCameraLocked(false);
  }, []);

  const lockCamera = useCallback(() => {
    console.log('🔒 Camera locked');
    setIsCameraLocked(true);
    
    // Réinitialiser la vue avec le nouveau cap
    if (location?.coords) {
      updateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: isNavigating ? 60 : 45,
        heading: calculatedHeading.current || heading || 0,
        altitude: isNavigating ? NAVIGATION_ALTITUDE : NORMAL_ALTITUDE,
        zoom: isNavigating ? 18 : 17
      });
    }
  }, [location, heading, isNavigating, updateCamera]);

  // Ajoutez cette fonction dans votre hook useMapCamera

  // Fonction pour ajuster la vue aux coordonnées d'une route
  const fitToCoordinates = useCallback((coordinates, options = {}) => {
    if (!mapRef?.current || !coordinates || coordinates.length < 2) {
      console.log("⚠️ Impossible d'ajuster la vue aux coordonnées:", { 
        mapRef: !!mapRef?.current, 
        hasCoords: !!coordinates,
        coordsLength: coordinates?.length 
      });
      return;
    }
    
    try {
      // Utiliser la méthode native de MapView
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: options.edgePadding || { top: 100, right: 100, bottom: 100, left: 100 },
        animated: options.animated !== false
      });
      console.log(`📍 Vue ajustée à ${coordinates.length} coordonnées`);
    } catch (error) {
      console.error("❌ Erreur lors de l'ajustement de la vue:", error);
    }
  }, [mapRef]);

  // Et n'oubliez pas d'ajouter cette fonction à votre objet retourné
  return {
    isCameraLocked,
    isPreviewMode,
    unlockCamera,
    lockCamera,
    NAVIGATION_ALTITUDE,
    PREVIEW_ALTITUDE,
    NORMAL_ALTITUDE,
    forceInitialLowView,
    fitToCoordinates // Ajoutez cette fonction ici
  };
};

export default useMapCamera;
