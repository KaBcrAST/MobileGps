import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api';

// Add retry utility
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

  async getRoute(origin, destination) {
    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    try {
      const formattedOrigin = this.formatCoords(origin);
      const formattedDestination = this.formatCoords(destination);

      console.log('🚗 Requesting route:', {
        origin: formattedOrigin,
        destination: formattedDestination
      });

      const response = await axios.get(`${API_URL}/api/route`, {
        params: {
          origin: formattedOrigin,
          destination: formattedDestination
        },
        timeout: 10000
      });

      if (response.data?.routes) {
        // Process each route to ensure proper coordinate encoding
        response.data.routes = response.data.routes.map(route => {
          // Get the encoded polyline from the route
          const encodedPolyline = route.overview_polyline?.points || route.polyline;
          
          // Decode the polyline into coordinates
          const coordinates = this.decodePolyline(encodedPolyline);

          return {
            ...route,
            coordinates,
            polyline: encodedPolyline
          };
        });
      }

      console.log(`✅ Found ${response.data?.routes?.length} routes`);
      return response.data;

    } catch (error) {
      console.error('❌ Navigation error:', error);
      throw error;
    }
  },

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

    console.log('📍 Fetching speed limit for:', {
      ...formattedCoords,
      accuracy,
      speed: location.coords.speed
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(`${API_URL}/speed-limit`, {
          params: { 
            latitude: formattedCoords.latitude,
            longitude: formattedCoords.longitude,
            accuracy
          },
          timeout: 5000, // Reduced timeout
          headers: {
            'Accept': 'application/json'
          }
        });

        console.log('✅ Speed limit response:', response.data);
        return response.data.speedLimit;

      } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isLastAttempt = attempt === retries;

        console.warn(`❌ Speed limit attempt ${attempt + 1}/${retries + 1} failed:`, {
          isTimeout,
          message: error.message
        });

        if (isLastAttempt) {
          console.error('❌ All speed limit attempts failed');
          return null;
        }

        // Wait before retry (exponential backoff)
        await wait(1000 * Math.pow(2, attempt));
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

const fetchRouteDetails = async (origin, destination, index) => {
  try {
    const response = await axios.get(`${API_URL}/navigation/route`, {
      params: {
        origin,
        destination,
        routeIndex: index
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch route details:', error);
    return null;
  }
};

export const getRouteDetails = async (origin, destination) => {
  try {
    const response = await axios.get(`${API_URL}/navigation/details`, {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch route details:', error);
    return null;
  }
};