import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Polyline } from 'react-native-maps';
import axios from 'axios';
import { API_URL } from '../../config/config';

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
  setActiveRoute, // ← Ajoutez cette prop pour permettre la mise à jour de l'itinéraire actif
}) => {
  const adjustedCoordinates = useRef(null);
  const [currentSegment, setCurrentSegment] = useState([]);
  const [remainingSegment, setRemainingSegment] = useState([]);
  const previousUserPosition = useRef(null);
  const lastClosestPointIndex = useRef(0);
  const offRouteCounter = useRef(0);
  const isRecalculating = useRef(false);
  const lastRecalculationTime = useRef(0);
  
  // Initialisation des coordonnées quand activeRoute change
  useEffect(() => {
    if (activeRoute?.coordinates && activeRoute.coordinates.length > 0) {
      adjustedCoordinates.current = activeRoute.coordinates;
      lastClosestPointIndex.current = 0;
      offRouteCounter.current = 0; // Réinitialiser le compteur de déviation
    } else {
      adjustedCoordinates.current = null;
    }
  }, [activeRoute]);

  // Calcul de distance entre deux points géographiques
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    
    const R = 6371e3; // Rayon de la Terre en mètres
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

  // Fonction pour recalculer l'itinéraire
  const recalculateRoute = useCallback(async () => {
    if (!location?.coords || !destination || isRecalculating.current) {
      return;
    }

    // Empêcher des recalculs trop fréquents (pas plus d'une fois toutes les 10 secondes)
    const now = Date.now();
    if (now - lastRecalculationTime.current < 10000) {
      return;
    }

    try {
      console.log('🔄 Recalcul de l\'itinéraire en cours...');
      isRecalculating.current = true;
      lastRecalculationTime.current = now;

      // Utiliser le service de navigation pour recalculer l'itinéraire
      const newRoute = await startDirectNavigation(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        destination,
        activeRoute?.avoidTolls || false
      );

      if (newRoute && newRoute.coordinates && newRoute.coordinates.length > 0) {
        console.log('✅ Nouvel itinéraire calculé avec succès');
        
        // Mettre à jour l'itinéraire actif
        setActiveRoute(newRoute);
        
        // Mettre à jour les informations de l'itinéraire
        setRouteInfo(newRoute);
        
        // Réinitialiser les compteurs
        lastClosestPointIndex.current = 0;
        offRouteCounter.current = 0;
        
        // Adapter la vue de la carte pour montrer le nouvel itinéraire
        if (mapRef && mapRef.current && newRoute.coordinates.length > 1) {
          // Zoomer sur une partie de l'itinéraire devant l'utilisateur
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

  // Mise à jour des segments de route en fonction de la position
  useEffect(() => {
    if (!isNavigating || !location?.coords || !adjustedCoordinates.current) {
      setCurrentSegment([]);
      setRemainingSegment([]);
      return;
    }

    const routeCoords = adjustedCoordinates.current;
    
    // Trouver l'index du point le plus proche sur la route
    let closestPointIndex = lastClosestPointIndex.current;
    let minDistance = Infinity;
    
    // Optimisation: chercher à partir du dernier point trouvé et quelques points avant
    const searchStart = Math.max(0, closestPointIndex - 5);
    // Limiter la recherche vers l'avant pour améliorer les performances
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
    
    // Mettre à jour l'index du point le plus proche
    lastClosestPointIndex.current = closestPointIndex;
    
    // Position actuelle de l'utilisateur
    const userPosition = { 
      latitude: location.coords.latitude, 
      longitude: location.coords.longitude 
    };
    
    // Construire le segment actuel (parcouru)
    let actualCurrentSegment = [];
    
    // Ajouter la position précédente pour une transition fluide
    if (previousUserPosition.current) {
      actualCurrentSegment.push(previousUserPosition.current);
    }
    
    // Ajouter la position actuelle
    actualCurrentSegment.push(userPosition);
    previousUserPosition.current = userPosition;
    
    // Segment actuel: points déjà parcourus + position actuelle
    setCurrentSegment([
      ...routeCoords.slice(0, closestPointIndex + 1),
      userPosition
    ]);
    
    // Segment restant: du point actuel jusqu'à la fin
    setRemainingSegment(routeCoords.slice(Math.max(0, closestPointIndex)));

    // NOUVELLE LOGIQUE: Détecter si l'utilisateur s'éloigne trop de l'itinéraire
    // Si la distance minimale est supérieure à 50 mètres, incrémenter le compteur de déviation
    if (minDistance > 50) {
      offRouteCounter.current++;
      
      // Si l'utilisateur est hors route pendant plusieurs mises à jour consécutives (environ 3-4 secondes)
      if (offRouteCounter.current > 3) {
        console.log(`🚗 Déviation détectée! Distance: ${minDistance.toFixed(0)}m`);
        recalculateRoute();
      }
    } else {
      // Réinitialiser le compteur si l'utilisateur est revenu sur la route
      offRouteCounter.current = 0;
    }
    
  }, [isNavigating, location?.coords?.latitude, location?.coords?.longitude, recalculateRoute]);

  // Rendu des itinéraires en mode sélection
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

  // Rendu de l'itinéraire actif en mode navigation avec segmentation
  if (isNavigating && activeRoute) {
    return (
      <>
        {/* Segment parcouru avec une couleur plus vive */}
        {currentSegment.length > 1 && (
          <Polyline
            coordinates={currentSegment}
            strokeWidth={8}
            strokeColor="#3498db" // Bleu vif
            zIndex={3}
            lineCap="round"
            lineJoin="round"
          />
        )}
        
        {/* Segment restant avec une couleur plus claire */}
        {remainingSegment.length > 1 && (
          <Polyline
            coordinates={remainingSegment}
            strokeWidth={6}
            strokeColor="#95c9f1" // Bleu plus clair
            zIndex={2}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </>
    );
  }

  return null;
};

export default RoutePolylines;