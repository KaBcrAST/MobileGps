import React from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import ClusterAlert from './ClusterAlert';

const API_URL = 'https://react-gpsapi.vercel.app/api';

const ClusterOverlay = ({ 
  nearbyCluster, 
  clusterDistance, 
  setNearbyCluster, 
  setClusterDistance 
}) => {
  if (!nearbyCluster) return null;

  const handleStillPresent = async () => {
    try {
      const response = await axios.post(`${API_URL}/reports`, {
        type: nearbyCluster.type,
        latitude: nearbyCluster.location.coordinates[1],
        longitude: nearbyCluster.location.coordinates[0]
      });

      console.log('✅ New report sent:', response.data);

      const clusterData = {
        ...nearbyCluster,
        count: nearbyCluster.count + 1,
        createdAt: new Date().toISOString()
      };
      setNearbyCluster(clusterData);

    } catch (error) {
      console.error('❌ Error sending new report:', error);
      Alert.alert('Erreur', 'Impossible de signaler à nouveau');
    }
  };

  return (
    <ClusterAlert 
      cluster={nearbyCluster}
      distance={clusterDistance}
      onDismiss={() => {
        setNearbyCluster(null);
        setClusterDistance(null);
      }}
      onStillPresent={handleStillPresent}
    />
  );
};

export default ClusterOverlay;