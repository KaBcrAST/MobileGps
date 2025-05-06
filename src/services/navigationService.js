import axios from 'axios';
import { API_URL } from '../config/config';

/**
 * Lance directement la navigation sans prévisualisation en utilisant l'API de routes
 * @param {Object} currentLocation - Coordonnées de l'utilisateur {latitude, longitude}
 * @param {Object} destination - Destination {latitude, longitude, name, address}
 * @param {Boolean} avoidTolls - Indique si les péages doivent être évités
 * @returns {Promise} Promesse contenant l'itinéraire direct pour la navigation
 */
export const startDirectNavigation = async (currentLocation, destination, avoidTolls = false) => {
  try {
    console.log("Démarrage navigation directe:", {
      origin: currentLocation,
      destination: destination
    });
    
    if (!currentLocation || !currentLocation.latitude) {
      throw new Error('Position actuelle non disponible');
    }
    
    // Utiliser l'API de prévisualisation pour obtenir un itinéraire
    // Cette approche garantit que nous utilisons le même format de données que la prévisualisation
    const response = await axios.get(`${API_URL}/api/navigation/preview`, {
      params: {
        origin: `${currentLocation.latitude},${currentLocation.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        avoidTolls: avoidTolls,
        mode: destination.mode || 'driving'
      }
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      console.log("Itinéraire direct reçu avec succès");
      // Nous prenons le premier itinéraire suggéré
      return {
        ...response.data.routes[0],
        origin: currentLocation,
        destination: destination,
        avoidTolls: avoidTolls
      };
    } else {
      console.warn("Réponse de l'API invalide:", response.data);
      throw new Error('Réponse invalide du serveur');
    }
  } catch (error) {
    console.error('Erreur lors du démarrage de la navigation directe:', error);
    // Nous ne créons pas d'itinéraire de secours car cela pourrait être dangereux
    // Mieux vaut échouer clairement et demander à l'utilisateur d'essayer à nouveau
    throw error;
  }
};

/**
 * Crée un itinéraire minimal en cas d'échec de l'API
 * @param {Object} origin - Coordonnées de départ
 * @param {Object} destination - Coordonnées d'arrivée
 * @returns {Object} Itinéraire minimal pour la navigation
 */
const createFallbackRoute = (origin, destination) => {
  return {
    origin: origin,
    destination: destination,
    coordinates: [
      origin ? { latitude: origin.latitude, longitude: origin.longitude } : null,
      { latitude: destination.latitude, longitude: destination.longitude }
    ].filter(Boolean),
    distance: { text: "Distance inconnue", value: 0 },
    duration: { text: "Durée inconnue", value: 0 },
    legs: [{
      steps: [],
      distance: { text: "Distance inconnue", value: 0 },
      duration: { text: "Durée inconnue", value: 0 },
      start_location: origin,
      end_location: destination
    }],
    direct: true
  };
};