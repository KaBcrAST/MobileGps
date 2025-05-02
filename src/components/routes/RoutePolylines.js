import React from 'react';
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
  location,
  destination,
  activeRoute,
  setRouteInfo,
  isPreviewMode,
  mapRef,
  fitToCoordinates // ⚠️ Ajoutez cette prop ici si elle manque
}) => {

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

  return (
    <>
      {showRoutes && !isNavigating && routes?.map((route, index) => 
        index !== selectedRoute && (
          <Polyline
            key={`route-${index}`}
            coordinates={route.coordinates}
            strokeWidth={5}
            strokeColor="#95a5a6"
            zIndex={1}
            tappable={true}
            onPress={() => onRouteSelect(index)}
          />
        )
      )}

      {showRoutes && !isNavigating && routes?.[selectedRoute] && (
        <Polyline
          coordinates={routes[selectedRoute].coordinates}
          strokeWidth={6}
          strokeColor="#3498db"
          zIndex={2}
        />
      )}

      {location && destination && !isNavigating && (
        <MapViewDirections
          origin={location.coords}
          destination={destination}
          apikey={API_KEY}
          strokeWidth={4}
          strokeColor="#3498db"
          mode="DRIVING"
          resetOnChange={false} 
          preserveViewport={true}
          onReady={(result) => {
            setRouteInfo(result);
            if (!isPreviewMode) {
              handleFitToCoordinates(
                [location.coords, destination]
              );
            }
          }}
          onError={error => console.error('DirectionsError:', error)}
        />
      )}

      {activeRoute?.coordinates && (
        <Polyline
          coordinates={activeRoute.coordinates}
          strokeColor="#3498db"
          strokeWidth={6}
          lineCap="round"
          lineJoin="round"
          geodesic={true}
        />
      )}
    </>
  );
};

export default RoutePolylines;