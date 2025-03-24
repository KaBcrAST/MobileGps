import { useState, useCallback } from 'react';

const useCameraControl = (mapRef) => {
  const [isCameraLocked, setIsCameraLocked] = useState(true);

  const updateCamera = useCallback((location) => {
    if (location?.coords && mapRef.current && isCameraLocked) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: location.coords.heading,
        pitch: 60,
        zoom: 18,
        altitude: 500,
      }, {
        duration: 300
      });
    }
  }, [isCameraLocked]);

  const unlockCamera = useCallback(() => {
    setIsCameraLocked(true);
  }, []);

  return { isCameraLocked, unlockCamera, updateCamera };
};

export default useCameraControl;