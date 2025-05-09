import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import ClusterAlert from './ClusterAlert';
import { API_URL } from '../../config/config';
// Importer les fonctions depuis le service
import { setupTrackService, loadSound, playSound } from '../../services/trackService';

const ClusterOverlay = ({ 
  nearbyCluster, 
  clusterDistance, 
  setNearbyCluster, 
  setClusterDistance 
}) => {
  const [soundReady, setSoundReady] = useState(false);

  // Initialiser le service audio au montage du composant
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Initialiser le service audio
        await setupTrackService();
        
        // Utiliser un chemin qui fonctionne sur les deux plateformes
        // En utilisant require pour référencer directement le fichier
        const success = await loadSound(
          'achievement', 
          require('../../../assets/sounds/achievement.mp3'), 
          'Achievement Sound'
        );
        
        if (success) {
          console.log('Son achievement chargé avec succès');
          setSoundReady(true);
        }
      } catch (e) {
        console.error('Erreur lors de l\'initialisation audio:', e);
      }
    };
    
    setupAudio();
  }, []);
  
  // Fonction simplifiée pour jouer le son
  const playAchievementSound = async () => {
    if (soundReady) {
      try {
        console.log('Tentative de lecture du son achievement...');
        await playSound('achievement');
      } catch (e) {
        console.error('Erreur lors de la lecture du son:', e);
      }
    } else {
      console.log('Son non prêt, impossible de jouer');
    }
  };

  if (!nearbyCluster) return null;

  const handleStillPresent = async () => {
    try {
      // Jouer le son immédiatement au clic, avant même la requête
      playAchievementSound();
      
      const response = await axios.post(`${API_URL}/api/reports`, {
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

  // Handler pour le bouton de fermeture avec son
  const handleDismiss = () => {
    // Jouer le son quand on ferme l'alerte
    playAchievementSound();
    
    // Fermer l'alerte
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