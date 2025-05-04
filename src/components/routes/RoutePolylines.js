import React, { useEffect, useState, useRef } from 'react';
import { Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import useMapCamera from '../../hooks/useMapCamera';

const API_KEY = "AIzaSyBtLW4mbOZNMU5GZyF502KnybtvteVAwlc";

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
  isPreviewMode
}) => {
  // Référence pour stocker les coordonnées ajustées
  const adjustedCoordinates = useRef(null);
  const [currentSegment, setCurrentSegment] = useState([]);
  const [remainingSegment, setRemainingSegment] = useState([]);
  
  // Fonction pour ajuster chaque point pour améliorer la précision
  const adjustCoordinates = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return [];
    
    // Facteur de correction - ajustez cette valeur selon les tests sur le terrain
    // Une valeur positive déplace les points vers l'est/nord
    // Une valeur négative déplace les points vers l'ouest/sud
    const latitudeOffset = -0.00005; // Environ 5m au sud
    const longitudeOffset = 0; // Pas de correction est/ouest par défaut
    
    return coordinates.map(coord => ({
      latitude: coord.latitude + latitudeOffset,
      longitude: coord.longitude + longitudeOffset
    }));
  };

  // Ajuster les coordonnées lorsque activeRoute change
  useEffect(() => {
    if (activeRoute?.coordinates && activeRoute.coordinates.length > 0) {
      adjustedCoordinates.current = adjustCoordinates(activeRoute.coordinates);
    } else {
      adjustedCoordinates.current = null;
    }
  }, [activeRoute]);

  // Mettre à jour les segments actuels et restants pour le mode navigation
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

    // Si on est proche d'un point, inclure ce point pour une transition plus fluide
    const segmentStart = Math.max(0, closestPointIndex - 1);
    
    // Segment actuel: de la position actuelle jusqu'au point le plus proche
    // + quelques points supplémentaires pour une transition fluide
    setCurrentSegment([
      // Commencer par la position exacte de l'utilisateur pour éviter un "saut"
      { 
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude 
      },
      ...coords.slice(segmentStart, closestPointIndex + 1)
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

  // Ajoutez cette vérification dans votre composant RoutePolylines
  const handleFitToCoordinates = (coords) => {
    if (fitToCoordinates && Array.isArray(coords) && coords.length > 1) {
      fitToCoordinates(coords);
    } else if (!fitToCoordinates) {
      // Alternative si fitToCoordinates n'est pas disponible
      console.warn("⚠️ fitToCoordinates n'est pas disponible, utilisation de l'alternative");
      if (mapRef?.current && Array.isArray(coords) && coords.length > 1) {
        try {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true
          });
        } catch (error) {
          console.error("❌ Erreur lors de l'ajustement de vue alternatif:", error);
        }
      }
    }
  };

  // Rendu des itinéraires en mode sélection
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

  // Rendu de l'itinéraire actif en mode navigation
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

  // Si aucun itinéraire n'est à afficher
  return null;
};

export default RoutePolylines;