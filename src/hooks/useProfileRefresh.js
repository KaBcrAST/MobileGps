import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useProfileRefresh = () => {
  const { user, refreshUserData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const silentRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    
    try {
      await refreshUserData();
      setLastRefresh(Date.now());
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, [refreshUserData, refreshing]);

  useEffect(() => {
    if (!user) return;
    
    silentRefresh();
    
    const refreshInterval = setInterval(() => {
      silentRefresh();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [user, silentRefresh]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      setLastRefresh(Date.now());
    } finally {
      setRefreshing(false);
    }
  };

  return {
    refreshing,
    lastRefresh,
    silentRefresh,
    handleManualRefresh
  };
};

export default useProfileRefresh;