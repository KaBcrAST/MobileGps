import { Alert } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

/**
 * Obtient la position actuelle de l'utilisateur avec gestion d'erreurs améliorée
 * @param {Object} options - Options de géolocalisation
 * @returns {Promise<Object|null>} - Position de l'utilisateur ou null en cas d'erreur
 */
export const getCurrentLocation = async (options = {}) => {
  try {
    // Vérifier d'abord les permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        "Permissions insuffisantes",
        "Vous devez autoriser l'accès à la localisation pour utiliser cette fonctionnalité.",
        [{ text: "OK" }]
      );
      return null;
    }

    // Paramètres par défaut pour la localisation
    const defaultOptions = {
      accuracy: Location.Accuracy.High,
      maximumAge: 10000,  // Accepter une position datant de 10 secondes max
      timeout: 15000      // Timeout après 15 secondes
    };

    // Tenter d'obtenir la position
    const position = await Location.getCurrentPositionAsync({
      ...defaultOptions,
      ...options
    });

    // Vérifier que la position est valide
    if (!position || !position.coords) {
      throw new Error("Position invalide reçue du service de localisation");
    }

    console.log("Position actuelle obtenue avec succès");
    return position;
    
  } catch (error) {
    console.error("Erreur lors de l'obtention de la position:", error);
    
    // Renvoyer un message d'erreur plus descriptif
    if (error.code === 1) {
      Alert.alert(
        "Localisation refusée",
        "L'accès à la localisation a été refusé. Vérifiez les paramètres de votre appareil."
      );
    } else if (error.code === 2) {
      Alert.alert(
        "Position indisponible",
        "Impossible de déterminer votre position. Vérifiez que GPS est activé et que vous êtes à l'extérieur."
      );
    } else if (error.code === 3) {
      Alert.alert(
        "Délai dépassé",
        "La recherche de votre position a pris trop de temps. Veuillez réessayer."
      );
    } else {
      Alert.alert(
        "Erreur de localisation",
        "Impossible d'obtenir votre position. Vérifiez que la localisation est activée."
      );
    }
    
    return null;
  }
};

/**
 * Géocode une adresse (texte) en coordonnées GPS
 */
export const geocodeAddress = async (address) => {
  try {
    console.log("Géocodage de l'adresse:", address);
    // Utilisation de l'API Nominatim d'OpenStreetMap (gratuite)
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        addressdetails: 1,
        limit: 1
      },
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'GPSNavigationApp/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        name: result.display_name.split(',')[0],
        address: result.display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Erreur lors du géocodage:", error);
    return null;
  }
};