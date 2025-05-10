import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { mapStyles } from '../styles/globalStyles';
import {
  getClusterIcon,
  getClusterColor,
  getClusterStyle,
  styles as clusterStyles
} from './clusters/ClusterUtils';
import ClusterOverlay from './clusters/ClusterOverlay';
import RoutePolylines from './routes/RoutePolylines';
import LocationMarker from './markers/LocationMarker';
import { API_URL } from '../config/config';
import useMapCamera from '../hooks/useMapCamera';
import FloatingMenu from './FloatingMenu'; 
import RoutePreview from './RoutePreview/RoutePreview';

const MapDisplay = ({ 
  mapRef,
  location,
  destination,
  heading,
  isNavigating,
  activeRoute,
  setRouteInfo,
  showRoutes,
  routes,
  selectedRoute,
  onRouteSelect,
  onStartNavigation,
  isPreviewMode,
  fitToCoordinates,
  forceInitialLowView,
  NORMAL_ALTITUDE // Assurez-vous que cette prop est bien passée
}) => {
  // CORRECTION: Obtenir l'instance de useMapCamera pour avoir accès aux valeurs calculées
  const { calculatedHeading } = useMapCamera(
    mapRef, 
    location, 
    heading, 
    isNavigating, 
    { destination, coordinates: activeRoute?.coordinates }
  );

  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [customDestination, setDestination] = useState(null);
  const [avoidTolls, setAvoidTolls] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [nearbyCluster, setNearbyCluster] = useState(null);
  const [clusterDistance, setClusterDistance] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [notifiedClusters] = useState(new Set());
  const initialCameraSetup = useRef(false);
  

  const handleQRScanned = (scannedLocation) => {
    if (scannedLocation && scannedLocation.latitude && scannedLocation.longitude) {
      setDestination({
        latitude: scannedLocation.latitude,
        longitude: scannedLocation.longitude,
        name: scannedLocation.name || "Destination QR",
        address: scannedLocation.address || scannedLocation.name || `Coordonnées GPS: ${scannedLocation.latitude}, ${scannedLocation.longitude}`
      });
      
      setShowRoutePreview(true);
    } else {
      Alert.alert("Erreur", "Les coordonnées scannées sont invalides ou incomplètes");
    }
  };

  const handlePreviewRouteSelect = useCallback((route) => {
    if (onRouteSelect) {
      onRouteSelect(route);
    }
  }, [onRouteSelect]);
  
  const handleStartNavigationFromPreview = useCallback((routeInfo) => {
    setShowRoutePreview(false);
    
    if (onStartNavigation) {
      onStartNavigation(routeInfo);
    } else {
      console.warn("Fonction onStartNavigation non définie. Navigation impossible.");
    }
  }, [onStartNavigation]);
  
  useEffect(() => {
    const fetchClusters = async () => {
      if (!location?.coords) return;

      try {
        const response = await axios.get(`${API_URL}/api/reports`, {
          params: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            maxDistance: 5000
          }
        });

        setClusters(response.data);

        if (response.data && response.data.length > 0) {
          response.data.forEach(cluster => {
            const clusterId = `${cluster.type}-${cluster.location.coordinates.join()}`;
            
            if (!notifiedClusters.has(clusterId) && cluster.distance < 300 && cluster.count >= 5) {
              notifiedClusters.add(clusterId);
              setNearbyCluster(cluster);
              setClusterDistance(Math.round(cluster.distance));
              
              setTimeout(() => {
                setNearbyCluster(null);
                setClusterDistance(null);
              }, 5000);
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch clusters:', error);
      }
    };

    fetchClusters();
    const interval = setInterval(fetchClusters, 30000);
    return () => clearInterval(interval);
  }, [location]);

  useEffect(() => {
    setShowRoute(isNavigating || showRoutes);
  }, [isNavigating, showRoutes]);

  const handleMapReady = () => {
    setIsMapReady(true);
    setLoading(false);
    
    setTimeout(() => {
      if (forceInitialLowView) {
        forceInitialLowView();
      }
    }, 500);
  };

  const handleViewMode = (mode) => {
    if (!mapRef?.current || !location?.coords) return;
    
    if (mode === 'overhead') {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: 0,
        altitude: NORMAL_ALTITUDE * 1.5,
        zoom: 17
      }, { duration: 500 });
    } else if (mode === 'follow') {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: 45,
        altitude: NORMAL_ALTITUDE,
        zoom: 17
      }, { duration: 500 });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  // Important: ne pas retourner null si on est en mode showRoutes mais pas en navigation,
  // car cela est nécessaire uniquement pour le composant dans NavigationMainScreen
  // if (showRoutes && !isNavigating) {
  //   return null;
  // }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={mapStyles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={false}
        followsUserLocation={false}
        showsCompass={!isNavigating}
        rotateEnabled={!isNavigating}
        pitchEnabled={!isNavigating}
        scrollEnabled={!isNavigating}
        zoomEnabled={!isNavigating}
        moveOnMarkerPress={false}
        onMapReady={handleMapReady}
      >
        {(isMapReady || !loading) && (
          <>
            {showRoute && (
              <RoutePolylines 
                showRoutes={showRoutes}
                isNavigating={isNavigating}
                routes={routes}
                selectedRoute={selectedRoute}
                onRouteSelect={onRouteSelect}
                location={location}
                destination={destination}
                activeRoute={activeRoute}
                setRouteInfo={setRouteInfo}
                isPreviewMode={isPreviewMode}
                mapRef={mapRef}
                fitToCoordinates={fitToCoordinates}
              />
            )}

            {/* CORRECTION: S'assurer que heading est toujours défini */}
            <LocationMarker location={location} heading={calculatedHeading || heading || 0} />

            {clusters && clusters.map(cluster => (
              <Marker
                key={`cluster-${cluster.type}-${cluster.location.coordinates.join()}`}
                coordinate={{
                  latitude: cluster.location.coordinates[1],
                  longitude: cluster.location.coordinates[0]
                }}
                zIndex={999}
              >
                <View style={[clusterStyles.clusterMarker, getClusterStyle(cluster.type)]}>
                  <Icon 
                    name={getClusterIcon(cluster.type)} 
                    size={24}
                    color={getClusterColor(cluster.type)}
                  />
                  {cluster.count >= 5 && (
                    <View style={clusterStyles.clusterCountBadge}>
                      <Text style={clusterStyles.clusterCountText}>{cluster.count}</Text>
                    </View>
                  )}
                </View>
              </Marker>
            ))}
          </>
        )}
      </MapView>

      <ClusterOverlay
        nearbyCluster={nearbyCluster}
        clusterDistance={clusterDistance}
        setNearbyCluster={setNearbyCluster}
        setClusterDistance={setClusterDistance}
      />

      {!isNavigating && (
        <>
          <TouchableOpacity 
            onPress={() => handleViewMode('overhead')}
            style={styles.topViewButton}
          >
            <Icon name="map-marker-path" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleViewMode('follow')}
            style={[styles.topViewButton, styles.followButton]}
          >
            <Icon name="compass" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {showRoutePreview && customDestination && (
        <RoutePreview
          origin={location?.coords || location}
          destination={customDestination}
          onRouteSelect={handlePreviewRouteSelect}
          onStartNavigation={handleStartNavigationFromPreview}
          avoidTolls={avoidTolls}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0'
  },
  userLocationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    borderWidth: 2,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center'
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db'
  },
  topViewButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#3498db',
    borderRadius: 24,
    padding: 8,
    elevation: 3,
  },
  followButton: {
    top: 64,
  }
});

// Pour faciliter la transition, on exporte à la fois sous le nom original "Map"
// et sous le nouveau nom "MapDisplay"
export const Map = MapDisplay;
export default MapDisplay;