import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/config';

const STORAGE_KEY = 'avoidTolls';
const DEFAULT_ZOOM = 15;
const ANIMATION_DURATION = 1000;

const useNavigationLogic = (location, mapRef) => {
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(0);
  const [activeRoute, setActiveRoute] = useState(null);
  const [avoidTolls, setAvoidTolls] = useState(false);

  useEffect(() => {
    loadTollPreference();
  }, []);

  const loadTollPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedPreference !== null) {
        setAvoidTolls(JSON.parse(savedPreference));
      }
    } catch (error) {
      console.error('Error loading toll preference:', error);
    }
  };

  const fetchRoute = useCallback(async () => {
    if (!location?.coords || !destination) return;

    try {
      const response = await axios.get(`${API_URL}`, {
        params: {
          origin: ``,
          destination: ``,
        }
      });
      
      if (response.data.routes?.[0]) {
        setActiveRoute(response.data.routes[0]);
        setRouteInfo(response.data.routes[0]);
      }
    } catch {
      setActiveRoute(null);
      setRouteInfo(null);
    }
  }, [location?.coords, destination, avoidTolls]);

  const endNavigation = useCallback(() => {
    setIsNavigating(false);
    setDestination(null);
    setRouteInfo(null);
    setActiveRoute(null);
    
    if (location?.coords && mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        pitch: 0,
        heading: 0,
        zoom: DEFAULT_ZOOM,
        duration: ANIMATION_DURATION
      });
    }
  }, [location?.coords, mapRef]);

  const handleTollPreferenceChange = useCallback(async (value) => {
    setAvoidTolls(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      if (destination) {
        await fetchRoute();
      }
    } catch {
    }
  }, [destination, fetchRoute]);

  const handleIncomingRouteData = (routeData) => {
    if (routeData && routeData.route) {
      setActiveRoute(routeData.route);
      setDestination({
        latitude: routeData.latitude,
        longitude: routeData.longitude,
        name: routeData.name,
        address: routeData.address
      });
      setIsNavigating(true);
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
    endNavigation,
    avoidTolls,
    handleTollPreferenceChange,
    handleIncomingRouteData
  };
};

export default useNavigationLogic;