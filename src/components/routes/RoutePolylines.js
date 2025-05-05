import React, { useEffect, useState, useRef } from 'react';
import { Polyline } from 'react-native-maps';
import useMapCamera from '../../hooks/useMapCamera';

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
}) => {
  const adjustedCoordinates = useRef(null);
  const [currentSegment, setCurrentSegment] = useState([]);
  const [remainingSegment, setRemainingSegment] = useState([]);
  const previousUserPosition = useRef(null);
  
  // Fonction améliorée pour ajuster les coordonnées
  const adjustCoordinates = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return [];
    
    // Facteur de correction plus précis
    const latitudeOffset = 0; // Aucun décalage par défaut
    const longitudeOffset = 0;
    
    return coordinates.map(coord => ({
      latitude: coord.latitude + latitudeOffset,
      longitude: coord.longitude + longitudeOffset
    }));
  };

  // Ajuster les coordonnées quand activeRoute change
  useEffect(() => {
    if (activeRoute?.coordinates && activeRoute.coordinates.length > 0) {
      adjustedCoordinates.current = adjustCoordinates(activeRoute.coordinates);
    } else {
      adjustedCoordinates.current = null;
    }
  }, [activeRoute]);

  // Mise à jour dynamique des segments actuels et restants
  useEffect(() => {
    if (!isNavigating || !location?.coords || !adjustedCoordinates.current) {
      setCurrentSegment([]);
      setRemainingSegment([]);
      return;
    }

    const coords = adjustedCoordinates.current;
    if (!coords || coords.length === 0) return;

    // Trouver l'index du point le plus proche de la position actuelle
    let closestPointIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < coords.length; i++) {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        coords[i].latitude,
        coords[i].longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = i;
      }
    }

    // Ajuster le segment actuel en fonction de la position réelle de l'utilisateur
    const userPosition = { 
      latitude: location.coords.latitude, 
      longitude: location.coords.longitude 
    };

    // ✨ AMÉLIORATION: Créer un tableau de positions dynamique pour le segment actuel
    let actualCurrentSegment = [];
    
    // Ajouter les dernières positions connues de l'utilisateur au segment actuel
    if (previousUserPosition.current) {
      actualCurrentSegment = [previousUserPosition.current];
    }
    
    // Ajouter la position actuelle
    actualCurrentSegment.push(userPosition);

    // Mettre à jour la position précédente
    previousUserPosition.current = userPosition;
    
    // Segment actuel: positions de l'utilisateur + quelques points du tracé devant
    setCurrentSegment([
      ...actualCurrentSegment,
      ...coords.slice(Math.max(0, closestPointIndex - 1), closestPointIndex + 2)
    ]);

    // Segment restant: du point le plus proche jusqu'à la fin
    setRemainingSegment(coords.slice(closestPointIndex));
  }, [isNavigating, location?.coords?.latitude, location?.coords?.longitude, activeRoute]);

  // Fonction utilitaire pour calculer la distance entre deux points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en mètres
  };

  // Rendu des itinéraires en mode sélection ou navigation
  if (showRoutes && routes && routes.length > 0) {
    return routes.map((route, index) => (
      <Polyline
        key={`route-${index}`}
        coordinates={adjustCoordinates(route.coordinates)}
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
        {/* Segment parcouru/actuel avec une couleur plus vive */}
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
            strokeColor="#95c9f1" // Bleu plus clair pour le segment restant
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