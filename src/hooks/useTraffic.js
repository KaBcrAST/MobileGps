import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api';

export const useTraffic = (location, destination) => {
  const [trafficInfo, setTrafficInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTraffic = useCallback(async () => {
    if (!location?.coords || !destination) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/traffic/route`, {
        params: {
          origin: `${location.coords.latitude},${location.coords.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`
        }
      });
      setTrafficInfo(response.data);
    } catch {
      setError('Impossible de charger les informations trafic');
    } finally {
      setLoading(false);
    }
  }, [location?.coords, destination]);

  useEffect(() => {
    fetchTraffic();
  }, [fetchTraffic]);

  return { trafficInfo, loading, error };
};