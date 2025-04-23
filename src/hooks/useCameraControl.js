import { useState, useCallback, useEffect, useRef } from 'react';

const useCameraControl = (mapRef, location, heading, isNavigating) => {
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const lastUpdateTime = useRef(0);
  const MINIMUM_UPDATE_INTERVAL = 2000; // 2 seconds between updates

  const unlockCamera = useCallback(() => {
    setIsCameraLocked(false);
  }, []);

  const lockCamera = useCallback(() => {
    setIsCameraLocked(true);
  }, []);

  useEffect(() => {
    if (!mapRef?.current || !location?.coords || !isCameraLocked) return;

    const currentTime = Date.now();
    if (currentTime - lastUpdateTime.current < MINIMUM_UPDATE_INTERVAL) {
      return;
    }

    // Only update camera if speed is above 0 or heading has changed significantly
    if (location.coords.speed > 0 || Math.abs(heading) > 0) {
      const camera = {
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: isNavigating ? 60 : 45,
        heading: heading || 0,
        altitude: isNavigating ? 500 : 1000,
        zoom: isNavigating ? 18 : 16,
      };

      mapRef.current.animateCamera(camera, { 
        duration: 1000 
      });

      lastUpdateTime.current = currentTime;
    }
  }, [location?.coords?.latitude, location?.coords?.longitude, heading, isNavigating, isCameraLocked]);

  return { isCameraLocked, unlockCamera, lockCamera };
};

export default useCameraControl;