import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { startDirectNavigation } from '../services/navigationService';

/**
 * Hook pour gérer les scans QR et leur traitement
 */
const useQRHandler = ({
  location,
  avoidTolls,
  setDestination,
  setActiveRoute,
  setRouteInfo,
  setIsNavigating,
  setShowRoutes
}) => {
  const [qrScannerVisible, setQRScannerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleQRScanned = useCallback(async (scannedLocation) => {
    // Cas d'un terme de recherche
    if (scannedLocation && scannedLocation.searchTerm) {
      setQRScannerVisible(false);
      setSearchQuery(scannedLocation.searchTerm);
      return;
    }
    
    // Cas de coordonnées GPS
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
        
        // Navigation directe demandée
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
        console.error('Error processing QR location:', error);
        Alert.alert("Erreur", "Impossible de traiter les coordonnées QR");
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert("Erreur", "Les coordonnées scannées sont invalides ou incomplètes");
    }
  }, [location, avoidTolls, setDestination, setActiveRoute, setRouteInfo, setIsNavigating, setShowRoutes]);

  const openQRScanner = useCallback(() => {
    setQRScannerVisible(true);
  }, []);

  const closeQRScanner = useCallback(() => {
    setQRScannerVisible(false);
  }, []);

  return {
    qrScannerVisible,
    loading,
    searchQuery,
    setSearchQuery,
    handleQRScanned,
    openQRScanner,
    closeQRScanner,
    setLoading
  };
};

export default useQRHandler;