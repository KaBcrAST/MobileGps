import axios from 'axios';
import { API_URL } from '../config/config';

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
      console.error('Invalid location data');
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

        console.warn(`❌ Speed limit attempt ${attempt + 1}/${retries + 1} failed:`, {
          isTimeout,
          message: error.message
        });

        if (isLastAttempt) {
          return null;
        }

        await wait(1000 * Math.pow(2, attempt));
      }
    }
  },

};


