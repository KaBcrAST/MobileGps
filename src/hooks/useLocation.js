import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export default function useLocation(mapRef) {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [speedLimit, setSpeedLimit] = useState(null);

  useEffect(() => {
    let locationSubscription;
    let speedLimitTimeout;

    const initializeLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });

      setLocation(initialLocation);
      setRegion({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      });

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1, // Changed to 1 to increase frequency
          timeInterval: 1000,
        },
        (newLocation) => {
          console.log('New location:', newLocation); // Debug log
          setLocation(newLocation);
          const speedKmh = (newLocation.coords.speed || 0) * 3.6;
          setSpeed(speedKmh < 1 ? 0 : Math.round(speedKmh));

          if (mapRef.current?.props?.followsUserLocation) {
            setRegion({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.003,
              longitudeDelta: 0.003,
            });
          }

          // Update speed limit every 30 seconds
          clearTimeout(speedLimitTimeout);
          speedLimitTimeout = setTimeout(() => {
            fetchSpeedLimit(
              newLocation.coords.latitude,
              newLocation.coords.longitude
            );
          }, 30000);
        }
      );
    };

    initializeLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      clearTimeout(speedLimitTimeout);
    };
  }, []);

  const fetchSpeedLimit = async (lat, lng) => {
    try {
      const query = `
        [out:json];
        way(around:20,${lat},${lng})[maxspeed];
        out body;
      `;
      
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );
      
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const speedLimitStr = data.elements[0].tags.maxspeed;
        const speedLimitNum = parseInt(speedLimitStr);
        if (!isNaN(speedLimitNum)) {
          setSpeedLimit(speedLimitNum);
        }
      }
    } catch (error) {
      console.error('Error fetching speed limit:', error);
    }
  };

  return { location, region, speed, speedLimit };
}