import { Alert } from 'react-native';
import { startDirectNavigation } from '../services/navigationService';

/**
 * Configure la caméra pour le mode navigation
 */
export const setupNavigationCamera = (mapRef, location, heading, altitude = 300) => {
  if (!mapRef?.current || !location?.coords) return;
  
  mapRef.current.animateCamera({
    center: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    },
    pitch: 60,
    altitude: altitude,
    heading: heading || 0,
    zoom: 18
  }, { duration: 300 });
};

/**
 * Traite un lieu sélectionné pour en faire une destination
 */
export const processSelectedPlace = (place) => {
  if (!place) return null;
  
  return place.structured_formatting 
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
};

/**
 * Traite une localisation scannée via QR code
 */
export const processQRLocation = async (scannedLocation, location, avoidTolls, callbacks) => {
  const { 
    setQRScannerVisible, 
    setSearchQuery, 
    setLoading, 
    setDestination, 
    setActiveRoute, 
    setRouteInfo,
    setIsNavigating, 
    setShowRoutes 
  } = callbacks;
  
  // Cas d'un terme de recherche
  if (scannedLocation && scannedLocation.searchTerm) {
    setQRScannerVisible(false);
    setSearchQuery && setSearchQuery(scannedLocation.searchTerm);
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
      Alert.alert("Erreur", "Impossible de traiter les coordonnées QR");
    } finally {
      setLoading(false);
    }
  } else {
    Alert.alert("Erreur", "Les coordonnées scannées sont invalides ou incomplètes");
  }
};

/**
 * Calcule la distance entre deux points GPS en mètres
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};