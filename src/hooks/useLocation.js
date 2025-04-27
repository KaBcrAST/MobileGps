import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const LOCATION_CONFIG = {
  accuracy: Location.Accuracy.BestForNavigation,
  distanceInterval: 1,
  timeInterval: 1000
};

const REGION_DELTA = {
  latitude: 0.003,
  longitude: 0.003
};

const SPEED_LIMIT_DELAY = 30000;

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
      if (status !== 'granted') return;

      const initialLocation = await Location.getCurrentPositionAsync(LOCATION_CONFIG);

      setLocation(initialLocation);
      setRegion({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        latitudeDelta: REGION_DELTA.latitude,
        longitudeDelta: REGION_DELTA.longitude,
      });

      locationSubscription = await Location.watchPositionAsync(
        LOCATION_CONFIG,
        (newLocation) => {
          setLocation(newLocation);
          const speedKmh = (newLocation.coords.speed || 0) * 3.6;
          setSpeed(speedKmh < 1 ? 0 : Math.round(speedKmh));

          if (mapRef.current?.props?.followsUserLocation) {
            setRegion({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: REGION_DELTA.latitude,
              longitudeDelta: REGION_DELTA.longitude,
            });
          }

          clearTimeout(speedLimitTimeout);
          speedLimitTimeout = setTimeout(() => {
            fetchSpeedLimit(
              newLocation.coords.latitude,
              newLocation.coords.longitude
            );
          }, SPEED_LIMIT_DELAY);
        }
      );
    };

    initializeLocation();

    return () => {
      locationSubscription?.remove();
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
      
      if (data.elements?.[0]?.tags?.maxspeed) {
        const speedLimitNum = parseInt(data.elements[0].tags.maxspeed);
        if (!isNaN(speedLimitNum)) {
          setSpeedLimit(speedLimitNum);
        }
      }
    } catch {
      setSpeedLimit(null);
    }
  };

  return { location, region, speed, speedLimit };
}