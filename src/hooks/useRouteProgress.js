import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/config';

const useRouteProgress = ({
  location,
  destination,
  isNavigating,
  selectedRouteIndex,
  activeRoute,
  onNearDestination
}) => {
  const [routeDetails, setRouteDetails] = useState(null);
  const [trafficInfo, setTrafficInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [initialDistance, setInitialDistance] = useState(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchRouteInfo = async () => {
      if (!location?.coords || !destination || !isNavigating) return;

      try {
        const response = await axios.get(`${API_URL}/navigation/info`, {
          params: {
            origin: `${location.coords.latitude},${location.coords.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            routeIndex: selectedRouteIndex
          }
        });
        
        setRouteDetails(response.data);
        
        if (response.data?.traffic) {
          setTrafficInfo(response.data.traffic);
        }
        
        if (initialDistance === null) {
          const distanceValue = 
            response.data?.distance?.value || 
            response.data?.distance || 
            (activeRoute?.distance?.value || activeRoute?.distance);
            
          if (distanceValue) {
            setInitialDistance(distanceValue);
          }
        }
      } catch (error) {
        console.error('Failed to fetch route info:', error);
      }
    };

    fetchRouteInfo();
    
    const interval = setInterval(fetchRouteInfo, 30000);
    return () => clearInterval(interval);
  }, [location, destination, isNavigating, selectedRouteIndex, initialDistance, activeRoute]);

  useEffect(() => {
    if (!location?.coords || !destination || !isNavigating) return;
    
    const calculateProgress = () => {
      try {
        let currentDistance = 0;
        
        if (activeRoute?.distance?.value) {
          currentDistance = activeRoute.distance.value;
        } else if (routeDetails?.distance?.value) {
          currentDistance = routeDetails.distance.value;
        }
        
        if (initialDistance === null && currentDistance > 0) {
          setInitialDistance(currentDistance);
          return 0;
        }
        
        if (initialDistance === null || currentDistance === 0) {
          return 0;
        }
        
        const progressValue = Math.max(0, Math.min(1, 1 - (currentDistance / initialDistance)));
        
        if (progressValue > 0.95 && typeof onNearDestination === 'function') {
          onNearDestination(true);
        }
        
        return progressValue;
      } catch (error) {
        console.error('Erreur lors du calcul de progression:', error);
        return 0;
      }
    };
    
    const updateProgress = () => {
      const newProgress = calculateProgress();
    
      if (newProgress !== progress) {
        setProgress(newProgress);
        
        Animated.timing(progressAnimation, {
          toValue: newProgress,
          duration: 500,
          useNativeDriver: false
        }).start();
      }
    };
    updateProgress();
    
    const progressInterval = setInterval(updateProgress, 5000);
    
    return () => clearInterval(progressInterval);
  }, [location, destination, isNavigating, activeRoute, routeDetails, initialDistance, progress, onNearDestination, progressAnimation]);

  const progressPercent = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return {
    routeDetails,
    trafficInfo,
    progress,
    progressAnimation,
    progressPercent
  };
};

export default useRouteProgress;