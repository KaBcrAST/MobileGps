import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import Map from '../components/MapDisplay';
import SearchBar from '../components/SearchBar/SearchBar';
import BlockInfo from '../components/BlockInfo';
import FloatingMenu from '../components/FloatingMenu';
import ReportMenu from '../components/ReportMenu';
import RoutePreview from '../components/RoutePreview/RoutePreview';
import useLocation from '../hooks/useLocation';
import useNavigationLogic from '../hooks/useNavigationLogic';
import globalStyles from '../styles/globalStyles';
import NavigationScreen from '../components/navigation/NavigationScreen';
import useMapCamera from '../hooks/useMapCamera';
import QRScanner from '../components/QRScanner';
import { startDirectNavigation } from '../services/navigationService';

export default function NavigationMainScreen() {
  const mapRef = useRef(null);
  const { location, region, speed } = useLocation(mapRef);
  const { 
    destination, 
    setDestination, 
    routeInfo, 
    setRouteInfo,
    isNavigating,
    setIsNavigating,
    endNavigation,
    heading,
    avoidTolls,
    handleTollPreferenceChange,
    activeRoute,
    setActiveRoute
  } = useNavigationLogic(location, mapRef);
  
  const {
    isCameraLocked, 
    unlockCamera, 
    lockCamera,
    fitToCoordinates,
    temporarilyDisableTracking
  } = useMapCamera(mapRef, location, heading, isNavigating);
  
  const [showRoutes, setShowRoutes] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [qrScannerVisible, setQRScannerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const onRouteSelect = (route) => {
    setSelectedRoute(route.index || 0);
    if (routes && routes.length > 0) {
      setRoutes(routes.map((r, i) => ({
        ...r,
        isSelected: i === (route.index || 0)
      })));
    }
  };

  const handlePlaceSelect = async (place) => {
    try {
      const destination = place.structured_formatting 
        ? {
            name: place.structured_formatting.main_text,
            address: place.structured_formatting.secondary_text,
            latitude: place.geometry?.location?.lat,
            longitude: place.geometry?.location?.lng
          }
        : {
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude
          };

      setDestination(destination);
      setShowRoutes(true);
    } catch (error) {
      console.error('Error handling place selection:', error);
    }
  };
  const handleStartNavigation = (selectedRoute) => {
    try {
      if (!selectedRoute) return;
      
      setActiveRoute(selectedRoute);
      setIsNavigating(true);
      setShowRoutes(false);
      
      if (selectedRoute.coordinates && fitToCoordinates) {
        fitToCoordinates(selectedRoute.coordinates, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 100,
            left: 50
          },
          animated: true
        });
      }
    } catch (error) {
      console.warn('Error starting navigation:', error);
    }
  };


const handleQRScanned = async (scannedLocation) => {
  
  if (scannedLocation && scannedLocation.searchTerm) {
    setQRScannerVisible(false);
    setSearchQuery && setSearchQuery(scannedLocation.searchTerm);
    return;
  }
  
  if (scannedLocation && scannedLocation.latitude && scannedLocation.longitude) {
    try {
      setQRScannerVisible(false);
      setLoading(true);
      
      const newDestination = {
        latitude: scannedLocation.latitude,
        longitude: scannedLocation.longitude,
        name: scannedLocation.name || "Destination QR",
        address: scannedLocation.address || `Coordonnées GPS: ${scannedLocation.latitude}, ${scannedLocation.longitude}`
      };
      
      setDestination(newDestination);
      
      if (scannedLocation.direct) {
        try {
          if (scannedLocation.route && scannedLocation.route.coordinates) {
            setActiveRoute(scannedLocation.route);
            setRouteInfo({
              distance: scannedLocation.route.distance || { text: "Distance inconnue", value: 0 },
              duration: scannedLocation.route.duration || { text: "Durée inconnue", value: 0 },
              remainingDistance: scannedLocation.route.distance,
              remainingDuration: scannedLocation.route.duration
            });
            
            setIsNavigating(true);
          }
          else {
            
            if (!location || !location.coords) {
              throw new Error("Impossible d'obtenir votre position actuelle");
            }
          
            const directRoute = await startDirectNavigation(
              location.coords, 
              newDestination,
              avoidTolls
            );
            
            setActiveRoute(directRoute);
            
            setRouteInfo({
              distance: directRoute.distance,
              duration: directRoute.duration,
              remainingDistance: directRoute.distance,
              remainingDuration: directRoute.duration
            });
            
            setIsNavigating(true);
            
          }
        } catch (error) {
          Alert.alert(
            "Erreur de navigation",
            "Impossible de démarrer la navigation directe. Affichage de la prévisualisation d'itinéraire."
          );
          setShowRoutes(true);
        }
      } else {
        setShowRoutes(true);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de traiter les coordonnées QR");
    } finally {
      setLoading(false);
    }
  } else {
    Alert.alert("Erreur", "Les coordonnées scannées sont invalides ou incomplètes");
  }
};

  const openQRScanner = () => {
    setQRScannerVisible(true);
  };

  if (!region) return null;

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Préparation de l'itinéraire...</Text>
        </View>
      ) : isNavigating ? (
        <NavigationScreen
          mapRef={mapRef}
          location={location}
          destination={destination}
          heading={heading}
          activeRoute={activeRoute}
          isCameraLocked={isCameraLocked}
          speed={speed}
          routeInfo={routeInfo}
          onEndNavigation={endNavigation}
        />
      ) : (
        <>
          <Map
            mapRef={mapRef}
            location={location}
            destination={destination}
            heading={heading}
            isNavigating={isNavigating}
            activeRoute={activeRoute}
            setRouteInfo={setRouteInfo}
            showRoutes={showRoutes}
            routes={routes}
            selectedRoute={selectedRoute}
            onRouteSelect={onRouteSelect}
            followsUserLocation={false}
            isCameraLocked={isCameraLocked}
            temporarilyDisableTracking={temporarilyDisableTracking}
            onOpenQRScanner={openQRScanner}
          />
          
          <QRScanner 
            visible={qrScannerVisible}
            onClose={() => setQRScannerVisible(false)}
            onQRScanned={handleQRScanned}
            setSearchQuery={setSearchQuery}
          />
          
          {showRoutes && (
            <RoutePreview
              origin={location?.coords}
              destination={destination}
              onRouteSelect={(route) => {
                setSelectedRoute(route.index || 0);
                onRouteSelect(route);
                if (route.routes) {
                  setRoutes(route.routes);
                }
              }}
              onStartNavigation={handleStartNavigation}
              avoidTolls={avoidTolls}
              mapRef={mapRef}
              fitToCoordinates={fitToCoordinates}
              temporarilyDisableTracking={temporarilyDisableTracking}
            />
          )}
          
          <SearchBar 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            onClear={() => setSearchQuery('')}
            onPlaceSelect={handlePlaceSelect} 
          />
          <BlockInfo 
            speed={speed}
            isNavigating={false}
            routeInfo={routeInfo}
          />
        </>
      )}
      
      <FloatingMenu 
        style={styles.floatingMenuStyle}
        onTollPreferenceChange={handleTollPreferenceChange}
        avoidTolls={avoidTolls}
        onCameraLockToggle={isCameraLocked ? unlockCamera : lockCamera}
        isCameraLocked={isCameraLocked}
        onOpenQRScanner={openQRScanner}
      />
      <ReportMenu location={location} />
    </View>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  container: {
    flex: 1,
  },
  floatingMenuStyle: {
    position: 'absolute',
    top: '8%',
    right: 20,
    zIndex: 1000,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333'
  }
});