import axios from 'axios';
const GOOGLE_MAPS_API_KEY = 'VOTRE_CLE_API_GOOGLE';

export const searchAddresses = async (query) => {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
      params: {
        input: query,
        key: GOOGLE_MAPS_API_KEY,
        types: 'address'
      }
    });
    return response.data.predictions;
  } catch (error) {
    console.error('Erreur de recherche d\'adresse', error);
    return [];
  }
};

export const getDirections = async (origin, destination) => {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
      params: {
        origin,
        destination,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    return response.data.routes[0].overview_polyline.points;
  } catch (error) {
    console.error('Erreur de récupération des directions', error);
    return null;
  }
};