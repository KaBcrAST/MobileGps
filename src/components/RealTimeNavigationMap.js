import React, { useEffect, useState } from 'react';
import { Platform, ActivityIndicator, View, StyleSheet, Text, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DirectionArrow from '../screens/DirectionArrow';
import { mapStyles } from '../styles/globalStyles';
import {
  getClusterIcon,
  getClusterColor,
  getClusterStyle,
  styles as clusterStyles
} from './clusters/ClusterUtils';
import ClusterAlert from './clusters/ClusterAlert';
import ClusterOverlay from './clusters/ClusterOverlay';
import { calculateDistance } from '../utils/distance';
import RoutePolylines from './routes/RoutePolylines';
import LocationMarker from './markers/LocationMarker';

const API_URL = 'https://react-gpsapi.vercel.app/api';  
const PREVIEW_ALTITUDE = 50000;
const NAVIGATION_ALTITUDE = 500;

const Map = ({ 
  mapRef,
  location,
  destination,
  heading,
  isNavigating,
  activeRoute,
  setRouteInfo,
  setNextStep,
  showRoutes,
  routes,
  selectedRoute,
  onRouteSelect,
  followsUserLocation
}) => {
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const [mapConfig, setMapConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState([]);
  const [nearbyCluster, setNearbyCluster] = useState(null);
  const [clusterDistance, setClusterDistance] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [notifiedClusters] = useState(() => new Set());
  const [showRoute, setShowRoute] = useState(true);

  useEffect(() => {
    const getMapConfig = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/map/config`);
        setMapConfig(data);
      } catch (error) {
        console.error('Error loading map config:', error);
      } finally {
        setLoading(false);
      }
    };

    getMapConfig();
  }, []);

  useEffect(() => {
    const fetchClusters = async () => {
      if (!location?.coords) return;

      try {
        const response = await axios.get(`${API_URL}/reports`, {
          params: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            maxDistance: 5000
          }
        });

        setClusters(response.data);

        // Vérifier les nouveaux clusters
        if (response.data.length > 0) {
          response.data.forEach(cluster => {
            const clusterId = `${cluster.type}-${cluster.location.coordinates.join()}`;
            
            if (!notifiedClusters.has(clusterId) && cluster.distance < 300 && cluster.count >= 5) {
              notifiedClusters.add(clusterId);
              console.log('🚨 New cluster found:', cluster);
              
              // Afficher la notification
              setNearbyCluster(cluster);
              setClusterDistance(Math.round(cluster.distance));
              
              // La cacher après 5 secondes
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
    setIsPreviewMode(location && destination && !isNavigating);
  }, [location, destination, isNavigating]);

  useEffect(() => {
    if (location && destination && isPreviewMode && mapRef.current) {
      const coordinates = [
        location.coords,
        {
          latitude: destination.latitude,
          longitude: destination.longitude
        }
      ];
      
      setTimeout(() => {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 150,
            right: 150,
            bottom: 150,
            left: 150
          },
          animated: true
        });
      }, 1000);
    }
  }, [isPreviewMode, location, destination]);

  useEffect(() => {
    if (!isNavigating) {
      setShowRoute(false);
    } else {
      setShowRoute(true);
    }
  }, [isNavigating]);

  if (loading || !mapConfig) {
    return (
      <View style={[mapStyles.map, mapStyles.center]}>
        <ActivityIndicator size="large" color="#0000ff" />
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
        mapType="standard"
        {...mapConfig.mapSettings}
        camera={{
          ...mapConfig.mapSettings.camera,
          heading: isPreviewMode ? 0 : heading,
          center: location?.coords || mapConfig.region,
          pitch: isPreviewMode ? 0 : 60,
          altitude: isPreviewMode ? PREVIEW_ALTITUDE : NAVIGATION_ALTITUDE,
          zoom: isPreviewMode ? 10 : undefined,
        }}
        initialRegion={mapConfig.region}
      >
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
      </MapView>

      <ClusterOverlay
        nearbyCluster={nearbyCluster}
        clusterDistance={clusterDistance}
        setNearbyCluster={setNearbyCluster}
        setClusterDistance={setClusterDistance}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  }
});

export { getClusterIcon, getClusterColor };
export default Map;