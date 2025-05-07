import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/config';

/**
 * Hook pour gérer la progression de l'itinéraire
 */
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

  // Récupérer les infos de l'itinéraire
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
        
        // Récupérer les informations de trafic si disponibles
        if (response.data?.traffic) {
          setTrafficInfo(response.data.traffic);
        }
        
        // Stocker la distance initiale si elle n'est pas encore définie
        if (initialDistance === null) {
          // Tester différentes structures possibles de la réponse
          const distanceValue = 
            response.data?.distance?.value || 
            response.data?.distance || 
            (activeRoute?.distance?.value || activeRoute?.distance);
            
          if (distanceValue) {
            console.log("🚀 Initialisation distance:", distanceValue);
            setInitialDistance(distanceValue);
          }
        }
      } catch (error) {
        console.error('Failed to fetch route info:', error);
      }
    };

    fetchRouteInfo();
    
    // Actualiser toutes les 30 secondes pendant la navigation
    const interval = setInterval(fetchRouteInfo, 30000);
    return () => clearInterval(interval);
  }, [location, destination, isNavigating, selectedRouteIndex, initialDistance, activeRoute]);

  // Calculer la progression du trajet en temps réel
  useEffect(() => {
    if (!location?.coords || !destination || !isNavigating) return;
    
    // Fonction pour calculer la progression
    const calculateProgress = () => {
      try {
        // Récupérer la distance restante (distance actuelle)
        let currentDistance = 0;
        
        if (activeRoute?.distance?.value) {
          currentDistance = activeRoute.distance.value;
        } else if (routeDetails?.distance?.value) {
          currentDistance = routeDetails.distance.value;
        }
        
        // Si nous n'avons pas la distance initiale, l'enregistrer maintenant
        if (initialDistance === null && currentDistance > 0) {
          console.log("✅ Distance initiale définie:", currentDistance);
          setInitialDistance(currentDistance);
          return 0; // Pas encore de progression
        }
        
        // Si nous n'avons pas les deux valeurs nécessaires, impossible de calculer
        if (initialDistance === null || currentDistance === 0) {
          return 0;
        }
        
        // Calculer le pourcentage de progression (0 à 1)
        // Plus la distance restante diminue, plus la progression augmente
        const progressValue = Math.max(0, Math.min(1, 1 - (currentDistance / initialDistance)));
        
        // Vérifier si la progression est suffisante pour considérer être arrivé
        if (progressValue > 0.95 && typeof onNearDestination === 'function') {
          onNearDestination(true); // Signaler au parent que l'utilisateur est presque arrivé
        }
        
        return progressValue;
      } catch (error) {
        console.error('Erreur lors du calcul de progression:', error);
        return 0;
      }
    };
    
    // Calculer la progression actuelle et l'appliquer immédiatement
    const updateProgress = () => {
      const newProgress = calculateProgress();
      
      // Mettre à jour la progression même pour de petits changements
      if (newProgress !== progress) {
        setProgress(newProgress);
        
        // Animer la transition vers la nouvelle valeur
        Animated.timing(progressAnimation, {
          toValue: newProgress,
          duration: 500,
          useNativeDriver: false
        }).start();
      }
    };
    
    // Calculer la progression immédiatement
    updateProgress();
    
    // Mettre à jour périodiquement
    const progressInterval = setInterval(updateProgress, 5000);
    
    return () => clearInterval(progressInterval);
  }, [location, destination, isNavigating, activeRoute, routeDetails, initialDistance, progress, onNearDestination, progressAnimation]);

  // Calculer le pourcentage de progression pour l'affichage
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