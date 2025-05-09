import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const useMapCamera = (mapRef, location, heading, isNavigating, { destination, coordinates } = {}) => {
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const initialViewApplied = useRef(false);
  const lastUpdateTime = useRef(0);
  const previousPosition = useRef(null);
  const calculatedHeading = useRef(heading || 0);
  const isMovingBackward = useRef(false);
  const lastHeadings = useRef([]);
  const lastCameraUpdate = useRef(0);
  
  const blockAutoUpdates = useRef(false);
  
  const isAndroid = Platform.OS === 'android';
  
  const NAVIGATION_ALTITUDE = isAndroid ? 40 : 60;
  const NORMAL_ALTITUDE = isAndroid ? 50 : 70;
  const PREVIEW_ALTITUDE = 1000;
  
  const NAVIGATION_PITCH = 80;
  const NORMAL_PITCH = 80;
  
  const OFFSET_DISTANCE = isAndroid ? -60 : 0;

  const offsetCoordinates = useCallback((latitude, longitude, heading, distanceInMeters) => {
    const earthRadius = 6378137;
    const headingRad = heading * Math.PI / 180;
    const angularDistance = distanceInMeters / earthRadius;
    const latRad = latitude * Math.PI / 180;
    const lonRad = longitude * Math.PI / 180;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(headingRad)
    );

    const newLonRad = lonRad + Math.atan2(
      Math.sin(headingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    return {
      latitude: newLatRad * 180 / Math.PI,
      longitude: newLonRad * 180 / Math.PI
    };
  }, []);

  const getDistance = useCallback((point1, point2) => {
    if (!point1 || !point2) return 0;
    const R = 6371e3;
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    return (bearing + 360) % 360;
  }, []);

  const animateCameraSafely = useCallback((camera, options = { duration: 1000 }) => {
    if (!mapRef?.current) return;
    try {
      mapRef.current.animateCamera(camera, options);
    } catch (error) {
      console.error('Failed to animate camera:', error);
    }
  }, [mapRef]);

  const getCameraConfig = useCallback((coords, navigating, currentHeading) => {
    if (!coords) return null;
    
    const headingToUse = currentHeading || 0;
    
    if (navigating) {
      const offsetCoords = offsetCoordinates(
        coords.latitude, 
        coords.longitude, 
        (headingToUse + 180) % 360, 
        Math.abs(OFFSET_DISTANCE)
      );
      
      return {
        center: offsetCoords,
        pitch: NAVIGATION_PITCH,
        heading: headingToUse,
        altitude: NAVIGATION_ALTITUDE,
        zoom: isAndroid ? 18.5 : 18
      };
    } else {
      return {
        center: { 
          latitude: coords.latitude, 
          longitude: coords.longitude 
        },
        pitch: NORMAL_PITCH,
        heading: headingToUse,
        altitude: NORMAL_ALTITUDE,
        zoom: isAndroid ? 18 : 17.5};
    }
  }, [offsetCoordinates, NAVIGATION_ALTITUDE, NORMAL_ALTITUDE, OFFSET_DISTANCE, isAndroid]);

  const temporarilyDisableTracking = useCallback((durationMs = 5000) => {
    blockAutoUpdates.current = true;
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
      if (timeDiff > 0) {
        const distance = getDistance(previousPosition.current, currentPosition);
        const speed = distance / timeDiff;
        if (speed > 0.3) {
          const bearing = getBearing(previousPosition.current, currentPosition);
          calculatedHeading.current = bearing;
        }
      }
    }

    previousPosition.current = currentPosition;
  }, [location?.coords, getDistance, getBearing]);

  useEffect(() => {
    if (!isNavigating || !mapRef?.current || !location?.coords || !isCameraLocked || blockAutoUpdates.current) {
      return;
    }
    
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) {
      return;
    }
    
    lastUpdateTime.current = now;
    
    const nextPoint = findNextPoint(location.coords, coordinates);
    const directionToUse = nextPoint ? getBearing(location.coords, nextPoint) : (calculatedHeading.current || heading || 0);
    
    const offsetCenter = offsetCoordinates(
      location.coords.latitude, 
      location.coords.longitude, 
      (directionToUse + 180) % 360,  
      Math.abs(OFFSET_DISTANCE)      
    );
    
    const camera = {
      center: offsetCenter,          
      pitch: NAVIGATION_PITCH,       
      heading: directionToUse,       
      altitude: NAVIGATION_ALTITUDE,
      zoom: isAndroid ? 18.5 : 18,   
    };
    
    animateCameraSafely(camera, { duration: isAndroid ? 600 : 800 });
    
  }, [mapRef, location?.coords?.latitude, location?.coords?.longitude, isNavigating, 
      isCameraLocked, coordinates, heading, getBearing, findNextPoint, 
      animateCameraSafely, offsetCoordinates, isAndroid]);

  const forceInitialLowView = useCallback(() => {
    if (!mapRef?.current || !location?.coords) return;
    if (initialViewApplied.current) return; 
    
    try {
      const directionToUse = heading || calculatedHeading.current || 0;
      
      blockAutoUpdates.current = true;
      
      mapRef.current.setCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: NORMAL_PITCH,
        heading: directionToUse,
        altitude: PREVIEW_ALTITUDE,
        zoom: isAndroid ? 18.5 : 18
      });
      
      initialViewApplied.current = true;
      
      setTimeout(() => {
        blockAutoUpdates.current = false;
      }, 2000);
    } catch (error) {
      console.error("Initial camera setting failed", error);
    }
  }, [mapRef, location?.coords, heading, isAndroid, NORMAL_PITCH, PREVIEW_ALTITUDE]);

  useEffect(() => {
    forceInitialLowView();
  }, [forceInitialLowView]);

  const unlockCamera = useCallback(() => {
    setIsCameraLocked(false);
  }, []);

  const lockCamera = useCallback(() => {
    setIsCameraLocked(true);
  }, []);

  const setPreviewMode = useCallback((isPreview) => {
    setIsPreviewMode(isPreview);
  }, []);

  const resetCameraView = useCallback(() => {
    if (!location?.coords) return;
    
    const camera = getCameraConfig(location.coords, isNavigating, calculatedHeading.current || heading);
    animateCameraSafely(camera, { duration: 500 });
  }, [location, isNavigating, heading, getCameraConfig, animateCameraSafely]);

  const fitToCoordinates = useCallback((coords, options = {}) => {
    if (!mapRef?.current || !coords || coords.length < 2) return;
    
    temporarilyDisableTracking(options.trackingDisableDuration || 5000);
    
    try {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: options.edgePadding || { top: 100, right: 100, bottom: 100, left: 100 },
        animated: options.animated !== false
      });
    } catch (error) {
      console.error("Failed to fit to coordinates", error);
    }
  }, [mapRef, temporarilyDisableTracking]);

  const focusOnLocation = useCallback((coords, options = {}) => {
    if (!mapRef?.current || !coords) return;
    
    temporarilyDisableTracking(options.trackingDisableDuration || 3000);
    
    const camera = {
      center: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      pitch: options.pitch || NORMAL_PITCH,
      heading: options.heading || calculatedHeading.current || heading || 0,
      altitude: options.altitude || NORMAL_ALTITUDE,
      zoom: options.zoom || 17,
    };
    
    animateCameraSafely(camera, { duration: options.duration || 800 });
  }, [mapRef, heading, animateCameraSafely, temporarilyDisableTracking, NORMAL_PITCH, NORMAL_ALTITUDE]);

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
    setPreviewMode,
    NAVIGATION_ALTITUDE,
    NORMAL_ALTITUDE,
    PREVIEW_ALTITUDE
  };
};

export default useMapCamera;

export const useCameraControl = useMapCamera;