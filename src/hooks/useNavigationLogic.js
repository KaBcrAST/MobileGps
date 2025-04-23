import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api';

const useNavigationLogic = (location, mapRef) => {
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(0);
  const [activeRoute, setActiveRoute] = useState(null);

  const fetchRoute = async () => {
    if (!location?.coords || !destination) return;

    try {
      const response = await axios.get(`${API_URL}/navigation/route`, {
        params: {
          origin: `${location.coords.latitude},${location.coords.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`
        }
      });
      
      if (response.data.routes?.[0]) {
        setActiveRoute(response.data.routes[0]);
        setRouteInfo(response.data.routes[0]);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const endNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setRouteInfo(null);
    setActiveRoute(null);
    
    // Reset map view
    if (location?.coords && mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        pitch: 0,
        heading: 0,
        zoom: 15,
        duration: 1000
      });
    }
  };

  return {
    destination,
    setDestination,
    routeInfo,
    setRouteInfo,
    isNavigating,
    setIsNavigating,
    heading,
    activeRoute,
    setActiveRoute,
    endNavigation
  };
};

export default useNavigationLogic;