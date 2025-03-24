import { useState, useEffect, useCallback } from 'react';

export default function useNavigationLogic(location, mapRef) {
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(0);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    // Add immediate camera focus here
    if (mapRef.current && location) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: location.coords.heading,
        pitch: 60,
        zoom: 18,
        altitude: 500,
      }, {
        duration: 300
      });
    }
  }, [location]);

  const stopNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setRouteInfo(null);
  };

  const setRouteInfoCallback = useCallback((info) => {
    if (info?.distance?.value && info?.duration?.value) {
      const distanceKm = (info.distance.value / 1000).toFixed(1);
      const durationMin = Math.round(info.duration.value / 60);
      
      console.log('Navigation Stats:', {
        distance: `${distanceKm} km`,
        duration: `${durationMin} min`,
        rawInfo: info
      });
    }
    setRouteInfo(info);
  }, []);

  return {
    destination,
    setDestination,
    routeInfo,
    setRouteInfo: setRouteInfoCallback,
    isNavigating,
    startNavigation,
    stopNavigation,
    heading
  };
}