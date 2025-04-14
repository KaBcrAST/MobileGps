import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useNavigationLogic(location, mapRef) {
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(0);
  const [avoidTolls, setAvoidTolls] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const loadTollPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem('avoidTolls');
        if (savedPreference !== null) {
          setAvoidTolls(savedPreference === 'true');
        }
      } catch (error) {
        console.error('Error loading toll preference:', error);
      }
    };

    loadTollPreference();
  }, []);

  // Save preference when it changes
  const handleTollPreferenceChange = async (newValue) => {
    try {
      await AsyncStorage.setItem('avoidTolls', String(newValue));
      setAvoidTolls(newValue);
      
      // Recalculate route if we have destination
      if (location && destination) {
        // ... existing route recalculation code ...
      }
    } catch (error) {
      console.error('Error saving toll preference:', error);
    }
  };

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
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
    setIsNavigating, // Make sure this is exported
    startNavigation,
    stopNavigation,
    heading,
    avoidTolls,
    handleTollPreferenceChange,
  };
}