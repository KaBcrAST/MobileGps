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
    setRouteInfo, // Ajout de setRouteInfo ici
    isNavigating,
    setIsNavigating,
    startNavigation,
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
    resetCameraView,
    focusOnLocation,
    fitToCoordinates,
    temporarilyDisableTracking
  } = useMapCamera(mapRef, location, heading, isNavigating);
  
  const [showRoutes, setShowRoutes] = useState(false);
  const [routes, setRoutes] = useState([]); // Ajout de routes state
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [qrScannerVisible, setQRScannerVisible] = useState(false);
  const [loading, setLoading] = useState(false); // Ajout de l'état loading
  const [searchQuery, setSearchQuery] = useState(''); // Ajout de searchQuery state
  
  // Fonction de sélection de route
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
      // Extraire les données de destination
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

  // Modifiez la fonction handleQRScanned pour démarrer directement la navigation

const handleQRScanned = async (scannedLocation) => {
  console.log("Coordonnées scannées:", scannedLocation);
  
  // Cas pour les adresses textuelles (searchTerm)
  if (scannedLocation && scannedLocation.searchTerm) {
    console.log("Recherche de l'adresse:", scannedLocation.searchTerm);
    setQRScannerVisible(false);
    setSearchQuery && setSearchQuery(scannedLocation.searchTerm);
    return;
  }
  
  if (scannedLocation && scannedLocation.latitude && scannedLocation.longitude) {
    try {
      // Fermer le scanner QR et afficher l'indicateur de chargement
      setQRScannerVisible(false);
      setLoading(true);
      
      // Créer un objet destination au format attendu
      const newDestination = {
        latitude: scannedLocation.latitude,
        longitude: scannedLocation.longitude,
        name: scannedLocation.name || "Destination QR",
        address: scannedLocation.address || `Coordonnées GPS: ${scannedLocation.latitude}, ${scannedLocation.longitude}`
      };
      
      // Définir la destination
      setDestination(newDestination);
      
      // Si le QR code a le flag direct, lancer la navigation directement
      if (scannedLocation.direct) {
        try {
          // Si un itinéraire est fourni, l'utiliser directement
          if (scannedLocation.route && scannedLocation.route.coordinates) {
            console.log("Utilisation de la route pré-calculée");
            
            // Utiliser directement la route fournie dans les données scannées
            setActiveRoute(scannedLocation.route);
            
            // Mettre à jour les informations de route
            setRouteInfo({
              distance: scannedLocation.route.distance || { text: "Distance inconnue", value: 0 },
              duration: scannedLocation.route.duration || { text: "Durée inconnue", value: 0 },
              remainingDistance: scannedLocation.route.distance,
              remainingDuration: scannedLocation.route.duration
            });
            
            // Activer immédiatement le mode navigation
            setIsNavigating(true);
            
            console.log("Navigation démarrée avec route préchargée vers:", newDestination.name);
          }
          // Sinon, calculer un itinéraire via l'API
          else {
            console.log("Calcul d'un itinéraire via l'API");
            
            // Vérifier que location.coords existe
            if (!location || !location.coords) {
              throw new Error("Impossible d'obtenir votre position actuelle");
            }
            
            // Appel au service de navigation directe qui utilise votre API
            const directRoute = await startDirectNavigation(
              location.coords, 
              newDestination,
              avoidTolls
            );
            
            console.log("Route calculée:", directRoute);
            
            // Définir l'itinéraire actif à partir de la réponse de l'API
            setActiveRoute(directRoute);
            
            // Mettre à jour les informations de route
            setRouteInfo({
              distance: directRoute.distance,
              duration: directRoute.duration,
              remainingDistance: directRoute.distance,
              remainingDuration: directRoute.duration
            });
            
            // Activer le mode navigation
            setIsNavigating(true);
            
            console.log("Navigation directe démarrée vers:", newDestination.name);
          }
        } catch (error) {
          console.error("Erreur lors du démarrage de la navigation directe:", error);
          Alert.alert(
            "Erreur de navigation",
            "Impossible de démarrer la navigation directe. Affichage de la prévisualisation d'itinéraire."
          );
          // En cas d'erreur, afficher la prévisualisation standard
          setShowRoutes(true);
        }
      } else {
        // Comportement normal pour afficher la prévisualisation
        setShowRoutes(true);
      }
    } catch (error) {
      console.error("Erreur lors du traitement des coordonnées QR:", error);
      Alert.alert("Erreur", "Impossible de traiter les coordonnées QR");
    } finally {
      setLoading(false);
    }
  } else {
    console.error("Format de coordonnées invalide ou incomplet");
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
            setRouteInfo={setRouteInfo} // Maintenant définie
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
            setSearchQuery={setSearchQuery} // Ajout de setSearchQuery
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
        style={styles.floatingMenuStyle} // Application du style personnalisé
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
  // Ajout de ce style pour positionner FloatingMenu plus à droite
  floatingMenuStyle: {
    position: 'absolute',
    top: '8%',
    right: 20, // Position plus à droite
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