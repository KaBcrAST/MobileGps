import { useState, useEffect } from 'react';

export default function useNavigationLogic(location, mapRef) {
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(0);

  const calculateBearing = (start, end) => {
    const toRad = n => n * Math.PI / 180;
    const toDeg = n => n * 180 / Math.PI;
    
    const lat1 = toRad(start.latitude);
    const lon1 = toRad(start.longitude);
    const lat2 = toRad(end.latitude);
    const lon2 = toRad(end.longitude);

    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  };
  const updateCameraView = (coords, bearing, isNav) => {
    if (!isNav) return;
    
    const offset = 0.0006;
    
    mapRef.current?.animateCamera({
      center: {
        latitude: coords.latitude - offset,
        longitude: coords.longitude
      },
      heading: bearing || 0,
      pitch: 45, // Fixed pitch angle
      zoom: 17.5,
      altitude: 120,
    }, { 
      duration: 300,
      mode: 'easeTo' // Add smooth transition
    });
  };
  
  // Remove the useEffect that was updating camera
  // Add pitch to initial MapView props in MapScreen.js

  const startNavigation = () => {
    if (location && destination) {
      const bearing = calculateBearing(location.coords, destination);
      setIsNavigating(true);
      setHeading(bearing);
      updateCameraView(location.coords, bearing);
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setRouteInfo(null);
  };

  useEffect(() => {
    if (isNavigating && location && destination) {
      const bearing = calculateBearing(location.coords, destination);
      setHeading(bearing);
      updateCameraView(location.coords, bearing);
    }
  }, [location, destination, isNavigating]);

  return {
    destination,
    setDestination,
    routeInfo,
    setRouteInfo, // Add this
    isNavigating,
    startNavigation,
    stopNavigation,
    heading
  };
}