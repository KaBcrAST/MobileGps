import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import ClusterAlert from './ClusterAlert';
import { API_URL } from '../../config/config';
import { setupTrackService, loadSound, playSound } from '../../services/trackService';

const ClusterOverlay = ({ 
  nearbyCluster, 
  clusterDistance, 
  setNearbyCluster, 
  setClusterDistance 
}) => {
  const [soundReady, setSoundReady] = useState(false);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setupTrackService();
        const success = await loadSound(
          'achievement', 
          require('../../../assets/sounds/achievement.mp3'), 
          'Achievement Sound'
        );
        
        if (success) {
          setSoundReady(true);
        }
      } catch (e) {
        console.error('Erreur lors de l\'initialisation audio:', e);
      }
    };
    
    setupAudio();
  }, []);
  
  const playAchievementSound = async () => {
    if (soundReady) {
      try {
        await playSound('achievement');
      } catch (e) {
        console.error('Erreur lors de la lecture du son:', e);
      }
    } else {
      console.warn('Le son n\'est pas prêt à être joué');
    }
      
  };

  if (!nearbyCluster) return null;

  const handleStillPresent = async () => {
    try {
      playAchievementSound();
      
      const response = await axios.post(`${API_URL}/api/reports`, {
        type: nearbyCluster.type,
        latitude: nearbyCluster.location.coordinates[1],
        longitude: nearbyCluster.location.coordinates[0]
      });


      const clusterData = {
        ...nearbyCluster,
        count: nearbyCluster.count + 1,
        createdAt: new Date().toISOString()
      };
      setNearbyCluster(clusterData);

    } catch (error) {
      console.error('❌ Error sending new report:', error);
    }
  };

  const handleDismiss = () => {
    playAchievementSound();
    setNearbyCluster(null);
    setClusterDistance(null);
  };

  return (
    <ClusterAlert 
      cluster={nearbyCluster}
      distance={clusterDistance}
      onDismiss={handleDismiss}
      onStillPresent={handleStillPresent}
    />
  );
};

export default ClusterOverlay;