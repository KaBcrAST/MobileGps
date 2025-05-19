import axios from 'axios';
import { API_URL } from '../config/config';

/**
 * @param {Object} currentLocation 
 * @param {Object} destination
 * @param {Boolean} avoidTolls 
 * @returns {Promise}
 */
export const startDirectNavigation = async (currentLocation, destination, avoidTolls = false) => {
  try {
    
    if (!currentLocation || !currentLocation.latitude) {
      throw new Error('Position actuelle non disponible');
    }
    
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
      const route = response.data.routes[0];
      
      // Extraire les informations de trafic si disponibles
      let trafficInfo = {
        hasSlowdowns: false,
        slowdownDuration: { value: 0, text: '0 min' }
      };
      
      if (route.traffic && route.traffic.hasSlowdowns) {
        trafficInfo = {
          hasSlowdowns: route.traffic.hasSlowdowns,
          slowdownDuration: route.traffic.slowdownDuration || { value: 0, text: '0 min' },
          durationWithTraffic: route.durationWithTraffic || route.duration
        };
        
        console.log("Informations de trafic détectées:", trafficInfo);
      }
      
      return {
        ...route,
        origin: currentLocation,
        destination: destination,
        avoidTolls: avoidTolls,
        traffic: trafficInfo
      };
    } else {
      console.warn("Réponse de l'API invalide:", response.data);
      throw new Error('Réponse invalide du serveur');
    }
  } catch (error) {
    console.error('Erreur lors du démarrage de la navigation directe:', error);
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