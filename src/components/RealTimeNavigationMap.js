import React, { useEffect, useState } from 'react';
import { Platform, ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
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

const Map = ({ 
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
  followsUserLocation,
  // Supprimez cette prop pour éviter la collision avec l'état local
  // loading
}) => {
  // Gardez uniquement cette déclaration de l'état loading
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapConfig, setMapConfig] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [nearbyCluster, setNearbyCluster] = useState(null);
  const [clusterDistance, setClusterDistance] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [notifiedClusters] = useState(new Set());
  
  const { 
    isCameraLocked,
    isPreviewMode,
    unlockCamera,
    lockCamera,
    NAVIGATION_ALTITUDE,
    PREVIEW_ALTITUDE,
    NORMAL_ALTITUDE,
    forceInitialLowView,
    fitToCoordinates,
    temporarilyDisableTracking
  } = useMapCamera(mapRef, location, heading, isNavigating, { 
    destination, 
    coordinates: activeRoute?.coordinates 
  });

  // Vous pouvez définir une fonction locale pour remplacer setCameraMode
  const handleViewMode = (mode) => {
    console.log(`Mode vue: ${mode}`);
    // Implémentation simplifiée selon le mode
    if (mode === 'overhead' && mapRef?.current && location?.coords) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: 0, // Vue du dessus
        altitude: NORMAL_ALTITUDE * 1.5,
        zoom: 17
      }, { duration: 500 });
    } else if (mode === 'follow' && mapRef?.current && location?.coords) {
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

  // Ajouter au début du composant:
  useEffect(() => {
    console.log('🗺️ Map Component: Navigation state changed to', isNavigating);
    return () => {
      console.log('🗺️ Map Component: Cleanup triggered');
    };
  }, [isNavigating]);

  // Récupérer les clusters sert
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

  // Gérer l'affichage de la route sert
  useEffect(() => {
    setShowRoute(isNavigating);
  }, [isNavigating]);

  // Pour le débogage
  useEffect(() => {
    console.log('Navigation state changed:', { 
      isNavigating, 
      hasRoute: !!activeRoute, 
      routeLength: activeRoute?.coordinates?.length || 0
    });
  }, [isNavigating, activeRoute]);

  // Fonction de gestion du chargement de la carte
  const handleMapReady = () => {
    setIsMapReady(true);
    setLoading(false);
    
    // Forcer uniquement la vue initiale basse après un court délai
    setTimeout(() => {
      if (forceInitialLowView) {
        forceInitialLowView();
      }
    }, 500);
  };

  // Afficher l'indicateur de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={mapStyles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={false}
        followsUserLocation={false}  // ✅ Correct pour votre cas d'usage
        showsCompass={!isNavigating} // Masquer la boussole en navigation
        rotateEnabled={!isNavigating} // Désactiver la rotation manuelle en navigation
        pitchEnabled={!isNavigating} // Désactiver l'inclinaison manuelle en navigation
        scrollEnabled={!isNavigating} // Désactiver le défilement manuel en navigation
        zoomEnabled={!isNavigating} // Désactiver le zoom manuel en navigation
        moveOnMarkerPress={false}
        onMapReady={handleMapReady}
      >
        {/* SUPPRIMÉ LE PREMIER ROUTEPOLYLINES ICI - C'ÉTAIT LE DOUBLON */}
        
        {(isMapReady || !loading) && (
          <>
            {/* Gardé uniquement cette instance de RoutePolylines */}
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

            <LocationMarker 
              location={location} 
              heading={heading} 
              
            />

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

export default Map;