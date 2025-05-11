import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Polyline } from 'react-native-maps';

const RoutePolylines = ({ 
  showRoutes,
  isNavigating, 
  routes, 
  selectedRoute, 
  onRouteSelect, 
  activeRoute, 
  location,
  mapRef,
  fitToCoordinates,
  destination,
  setRouteInfo,
  setActiveRoute, 
}) => {
  const adjustedCoordinates = useRef(null);
  const [remainingSegment, setRemainingSegment] = useState([]);
  const previousUserPosition = useRef(null);
  const lastClosestPointIndex = useRef(0);
  const offRouteCounter = useRef(0);
  const isRecalculating = useRef(false);
  const lastRecalculationTime = useRef(0);
  
  useEffect(() => {
    if (activeRoute?.coordinates && activeRoute.coordinates.length > 0) {
      adjustedCoordinates.current = activeRoute.coordinates;
      lastClosestPointIndex.current = 0;
      offRouteCounter.current = 0; 
      setRemainingSegment(activeRoute.coordinates);
    } else {
      adjustedCoordinates.current = null;
      setRemainingSegment([]);
    }
  }, [activeRoute]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const recalculateRoute = useCallback(async () => {
    if (!location?.coords || !destination || isRecalculating.current) {
      return;
    }

    const now = Date.now();
    if (now - lastRecalculationTime.current < 10000) {
      return;
    }

    try {
      isRecalculating.current = true;
      lastRecalculationTime.current = now;

      const newRoute = await startDirectNavigation(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        destination,
        activeRoute?.avoidTolls || false
      );

      if (newRoute && newRoute.coordinates && newRoute.coordinates.length > 0) {
        
        setActiveRoute(newRoute);
        setRouteInfo(newRoute);
        lastClosestPointIndex.current = 0;
        offRouteCounter.current = 0;
        
        if (mapRef && mapRef.current && newRoute.coordinates.length > 1) {
          const relevantCoordinates = newRoute.coordinates.slice(0, Math.min(10, newRoute.coordinates.length));
          
          fitToCoordinates(relevantCoordinates, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
            trackingDisableDuration: 3000
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du recalcul de l\'itinéraire:', error);
    } finally {
      isRecalculating.current = false;
    }
  }, [location?.coords, destination, activeRoute, setActiveRoute, setRouteInfo, mapRef, fitToCoordinates]);

  useEffect(() => {
    if (!isNavigating || !location?.coords || !adjustedCoordinates.current) {
      return;
    }
    
    const routeCoords = adjustedCoordinates.current;
    let closestPointIndex = lastClosestPointIndex.current;
    let minDistance = Infinity;
    
    const searchStart = Math.max(0, closestPointIndex - 5);
    const searchEnd = Math.min(routeCoords.length, closestPointIndex + 30);
    
    for (let i = searchStart; i < searchEnd; i++) {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        routeCoords[i].latitude,
        routeCoords[i].longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = i;
      }
    }
    
    if (closestPointIndex > lastClosestPointIndex.current) {
      const keepFromIndex = Math.max(0, closestPointIndex - 1);
      
      setRemainingSegment([
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        ...routeCoords.slice(keepFromIndex)
      ]);
      
      lastClosestPointIndex.current = closestPointIndex;
    }
    
    previousUserPosition.current = { 
      latitude: location.coords.latitude, 
      longitude: location.coords.longitude 
    };

    if (minDistance > 50) {
      offRouteCounter.current++;
      
      if (offRouteCounter.current > 3) {
        recalculateRoute();
      }
    } else {
      offRouteCounter.current = 0;
    }
    
  }, [isNavigating, location?.coords?.latitude, location?.coords?.longitude, recalculateRoute]);

  if (showRoutes && routes && routes.length > 0) {
    return routes.map((route, index) => (
      <Polyline
        key={`route-${index}`}
        coordinates={route.coordinates}
        strokeWidth={selectedRoute === index ? 8 : 4}
        strokeColor={selectedRoute === index ? '#3498db' : '#bdc3c7'}
        tappable={true}
        onPress={() => onRouteSelect(index)}
        zIndex={selectedRoute === index ? 2 : 1}
        lineCap="round"
        lineJoin="round"
      />
    ));
  }

  if (isNavigating && activeRoute && remainingSegment.length > 1) {
    return (
      <Polyline
        coordinates={remainingSegment}
        strokeWidth={6}
        strokeColor="rgb(74, 58, 255)" 
        zIndex={2}
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  return null;
};

export default RoutePolylines;