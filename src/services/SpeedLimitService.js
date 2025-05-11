import axios from 'axios';
import { API_URL } from '../config/config';

// Export the decode polyline utility
export const decodePolyline = (encoded) => {
  if (!encoded) return [];
  
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5
    });
  }

  return poly;
};

export const navigationService = {
  decodePolyline,

  async getSpeedLimit(location, retries = 2) {
    if (!location?.coords?.latitude || !location?.coords?.longitude) {
      return null;
    }

    const { latitude, longitude, accuracy } = location.coords;
    const formattedCoords = {
      latitude: Number(latitude).toFixed(6),
      longitude: Number(longitude).toFixed(6)
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(`${API_URL}/api/speed-limit`, {
          params: { 
            latitude: formattedCoords.latitude,
            longitude: formattedCoords.longitude,
            accuracy
          },
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        });

        return response.data.speedLimit;

      } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isLastAttempt = attempt === retries;

        if (isLastAttempt) {
          return null;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  },

  formatCoords(coords) {
    if (!coords) return null;
    
    const lat = coords.coords?.latitude || coords.latitude;
    const lng = coords.coords?.longitude || coords.longitude;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Invalid coordinates format');
    }

    return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
  }
};

// Helper function for waiting between retries
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


