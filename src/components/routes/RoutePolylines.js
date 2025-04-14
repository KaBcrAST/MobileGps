import React from 'react';
import { Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

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
  mapRef 
}) => {
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
              mapRef.current?.fitToCoordinates(
                [location.coords, destination],
                {
                  edgePadding: {
                    top: 150,
                    right: 150,
                    bottom: 150,
                    left: 150
                  },
                  animated: true
                }
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