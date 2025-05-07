import * as Location from 'expo-location';
import axios from 'axios';

/**
 * Obtient la position actuelle de l'utilisateur
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission de localisation refusée');
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  } catch (error) {
    console.error('Erreur lors de l\'obtention de la localisation:', error);
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