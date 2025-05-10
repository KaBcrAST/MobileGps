import { useState, useCallback } from 'react';

/**
 * Hook pour gérer les routes et leur sélection
 */
const useRouteManager = () => {
  const [showRoutes, setShowRoutes] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  
  const selectRoute = useCallback((route) => {
    const routeIndex = route.index || 0;
    setSelectedRoute(routeIndex);
    
    if (routes && routes.length > 0) {
      setRoutes(routes.map((r, i) => ({
        ...r,
        isSelected: i === routeIndex
      })));
    }
  }, [routes]);
  
  const clearRoutes = useCallback(() => {
    setRoutes([]);
    setSelectedRoute(0);
    setShowRoutes(false);
  }, []);

  return {
    routes,
    setRoutes,
    showRoutes,
    setShowRoutes,
    selectedRoute,
    selectRoute,
    clearRoutes
  };
};

export default useRouteManager;