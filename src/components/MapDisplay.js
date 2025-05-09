import React, { useEffect, useState, useCallback } from 'react';
import { Platform, ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
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
import FloatingMenu from './FloatingMenu'; // Nous gardons uniquement cette importation
import RoutePreview from './RoutePreview/RoutePreview';

//normal display sans navigation
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
  onStartNavigation, 
}) => {
  // Supprimez l'état qrScannerVisible
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
  
  const { 
    isPreviewMode,
    forceInitialLowView,
    fitToCoordinates
  } = useMapCamera(mapRef, location, heading, isNavigating, { 
    destination, 
    coordinates: activeRoute?.coordinates 
  });

  // Fonction pour gérer les coordonnées obtenues depuis le QR code
  const handleQRScanned = (scannedLocation) => {
    console.log("Coordonnées scannées:", scannedLocation);
    
    if (scannedLocation && scannedLocation.latitude && scannedLocation.longitude) {
      // Définir la destination
      setDestination({
        latitude: scannedLocation.latitude,
        longitude: scannedLocation.longitude,
        name: scannedLocation.name || "Destination QR",
        address: scannedLocation.address || scannedLocation.name || `Coordonnées GPS: ${scannedLocation.latitude}, ${scannedLocation.longitude}`
      });
      
      // Afficher la prévisualisation de route
      setShowRoutePreview(true);
    } else {
      console.error("Format de coordonnées invalide ou incomplet");
      Alert.alert("Erreur", "Les coordonnées scannées sont invalides ou incomplètes");
    }
  };

  // Ajouter au début du composant:
  useEffect(() => {
    console.log('🗺️ Map Component: Navigation state changed to', isNavigating);
    return () => {
      console.log('🗺️ Map Component: Cleanup triggered');
    };
  }, [isNavigating]);

  // Gérer la sélection d'itinéraire dans la prévisualisation
  const handlePreviewRouteSelect = useCallback((route) => {
    if (onRouteSelect) {
      onRouteSelect(route);
    }
  }, [onRouteSelect]);
  
  // Gérer le démarrage de la navigation depuis la prévisualisation
  const handleStartNavigationFromPreview = useCallback((routeInfo) => {
    setShowRoutePreview(false); // Fermer la prévisualisation
    
    if (onStartNavigation) {
      onStartNavigation(routeInfo);
    } else {
      console.warn("Fonction onStartNavigation non définie. Navigation impossible.");
    }
  }, [onStartNavigation]);
  
  // Récupérer les clusters
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

  // Gérer l'affichage de la route
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

  // Cherchez et modifiez des effets comme celui-ci:
  useEffect(() => {
    if (mapRef.current && location?.coords) {
      // Si vous voyez du code qui met à jour la caméra ici, commentez-le
      // mapRef.current.animateCamera({...});
    }
  }, [location]);

  // Fonctions pour le mode de vue
  const handleViewMode = (mode) => {
    if (mode === 'overhead' && mapRef.current && location?.coords) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: 0,
        heading: 0,
        altitude: 1000,
        zoom: 15,
      });
    } else if (mode === 'follow' && mapRef.current && location?.coords) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: 60,
        heading: heading || 0,
        zoom: 18,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (showRoutes && !isNavigating) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={mapStyles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={false}
        followsUserLocation={false}
        showsCompass={true}
        rotateEnabled={!isNavigating}
        pitchEnabled={true}
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

      <ClusterOverlay
        nearbyCluster={nearbyCluster}
        clusterDistance={clusterDistance}
        setNearbyCluster={setNearbyCluster}
        setClusterDistance={setClusterDistance}
      />

      {/* FloatingMenu avec la fonction QR Scanner */}
      {!isNavigating && (
        <FloatingMenu 
          onTollPreferenceChange={setAvoidTolls}
          avoidTolls={avoidTolls}
          onQRScanned={handleQRScanned} // Passez la fonction de traitement QR ici
          onReinitializeCamera={forceInitialLowView}
        />
      )}

      {/* Boutons de vue (si vous souhaitez les conserver) */}
      {!isNavigating && (
        <>
          <TouchableOpacity 
            onPress={() => handleViewMode('overhead')}
            style={styles.topViewButton}
          >
            <Icon name="map-marker-path" size={24} color="#fff" />
          </TouchableOpacity>

         
        </>
      )}


      {/* Prévisualisation de route (modal ou overlay) */}
      {showRoutePreview && customDestination && (
        <RoutePreview
          origin={location}
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
    bottom: 20,
    right: 20,
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  followButton: {
    bottom: 80, // Au-dessus du premier bouton
    backgroundColor: '#27ae60',
  },
  qrButton: {
    bottom: 140, // Au-dessus des deux autres boutons
    backgroundColor: '#9b59b6', // Couleur violette pour le distinguer
  }
});

export default Map;