import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import { API_URL } from '../../config/config';
import useMapCamera from '../../hooks/useMapCamera';

const RoutePreview = ({ origin, destination, onRouteSelect, onStartNavigation, avoidTolls }) => {
  const mapRef = useRef(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const { fitToCoordinates } = useMapCamera(mapRef);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/navigation/preview`, {
          params: {
            origin: `${origin.latitude},${origin.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            avoidTolls: avoidTolls 
          }
        });

        if (response.data.routes) {
          const twoRoutes = response.data.routes.slice(0, 2);
          setRoutes(twoRoutes);
          
          if (twoRoutes.length > 0 && twoRoutes[0].coordinates) {
            fitToCoordinates(twoRoutes[0].coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
              animated: true
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      }
    };

    if (origin && destination) {
      fetchRoutes();
    }
  }, [origin, destination, avoidTolls, fitToCoordinates]);

  const handleRouteSelect = (index) => {
    setSelectedRouteIndex(index);
    const selectedRoute = routes[index];
    
    if (onRouteSelect && selectedRoute) {
      console.log('Selected route:', selectedRoute);
      onRouteSelect({
        ...selectedRoute,
        index: index
      });
    }

    if (routes[index]?.coordinates) {
      fitToCoordinates(routes[index].coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
        animated: true
      });
    }
  };

  const handleStartNavigation = () => {
    if (!routes?.[selectedRouteIndex]) return;
    
    const selectedRoute = routes[selectedRouteIndex];
    onStartNavigation({
      ...selectedRoute,
      index: selectedRouteIndex,
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      avoidTolls: avoidTolls
    });
  };

  const formatDuration = (duration) => {
    if (typeof duration === 'object') {
      return duration.text;
    }
    return duration;
  };

  const formatDistance = (distance) => {
    if (typeof distance === 'object') {
      return distance.text;
    }
    return distance;
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
          pitch: 45,
          bearing: 0
        }}
      >
        {routes.map((route, index) => (
          <Polyline
            key={index}
            coordinates={route.coordinates}
            strokeWidth={index === selectedRouteIndex ? 6 : 3}
            strokeColor={index === selectedRouteIndex ? '#3498db' : '#95a5a6'}
            zIndex={index === selectedRouteIndex ? 2 : 1}
          />
        ))}

        <Marker coordinate={origin} pinColor="green" />
        <Marker coordinate={destination} pinColor="red" />
      </MapView>

      <View style={styles.routesCarousel}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routesScrollContent}
        >
          {routes.map((route, index) => {
            const isSelected = index === selectedRouteIndex;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.routeCard, isSelected && styles.selectedRouteCard]}
                onPress={() => handleRouteSelect(index)}
              >
                <View style={styles.routeCardContent}>
                  <View style={styles.routeMainInfo}>
                    <Text style={[styles.routeTime, isSelected && styles.selectedRouteText]}>
                      {formatDuration(route.duration)}
                    </Text>
                    <Text style={[styles.routeDistance, isSelected && styles.selectedRouteText]}>
                      {formatDistance(route.distance)}
                    </Text>
                  </View>
                  <Text style={[styles.routeVia, isSelected && styles.selectedRouteText]}>
                    {index === 0 ? 'Route principale' : 'Alternative'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity 
          style={styles.goButton}
          onPress={handleStartNavigation}
        >
          <Text style={styles.goButtonText}>GO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    flex: 1,
  },
  routesCarousel: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingVertical: 10,
  },
  routesScrollContent: {
    paddingHorizontal: 10,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 6,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedRouteCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3498db',
    borderWidth: 2,
  },
  routeCardContent: {
    gap: 8,
  },
  routeMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  routeDistance: {
    fontSize: 16,
    color: '#4b5563',
  },
  routeVia: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedRouteText: {
    color: '#3498db',
  },
  goButton: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  goButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RoutePreview;