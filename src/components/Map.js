import React, { useEffect, useState } from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import axios from 'axios';
import DirectionArrow from '../screens/DirectionArrow';
import { mapStyles } from '../styles/globalStyles';

const API_URL = 'https://react-gpsapi.vercel.app/api/map';

const Map = ({ 
  mapRef,
  location,
  destination,
  heading,
  isNavigating,
  activeRoute,
  setRouteInfo,
  setNextStep
}) => {
  const [mapConfig, setMapConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMapConfig = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/config`);
        setMapConfig(data);
      } catch (error) {
        console.error('Error loading map config:', error);
      } finally {
        setLoading(false);
      }
    };

    getMapConfig();
  }, []);

  if (loading || !mapConfig) {
    return (
      <View style={[mapStyles.map, mapStyles.center]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={mapStyles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      mapType="standard"
      {...mapConfig.mapSettings}
      camera={{
        ...mapConfig.mapSettings.camera,
        heading,
        center: location?.coords || mapConfig.region
      }}
      initialRegion={mapConfig.region}
    >
      {/* Direction markers and routes */}
      {location && destination && !isNavigating && (
        <MapViewDirections
          origin={location.coords}
          destination={destination}
          apikey="AIzaSyAMthwpI5QDvhvxS-fuqVasqK3vr3U8dms"
          strokeWidth={4}
          strokeColor="#3498db"
          mode="DRIVING"
          onReady={setRouteInfo}
          onError={error => console.error('DirectionsError:', error)}
        />
      )}

      {location && destination && isNavigating && activeRoute && (
        <MapViewDirections
          origin={location.coords}
          destination={destination}
          strokeWidth={4}
          strokeColor="#3498db"
          apikey="AIzaSyAMthwpI5QDvhvxS-fuqVasqK3vr3U8dms"
          mode="DRIVING"
          resetOnChange={false}
          onReady={setRouteInfo}
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

      {location && (
        <Marker 
          coordinate={location.coords} 
          flat 
          anchor={{ x: 0.5, y: 0.5 }} 
          rotation={heading}
        >
          <DirectionArrow heading={heading} />
        </Marker>
      )}
    </MapView>
  );
};

export default Map;