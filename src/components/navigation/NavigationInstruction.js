import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { API_URL } from '../../config/config';

const formatInstruction = (instruction) => {
  if (!instruction) return 'Continuez tout droit';

  let formatted = instruction;
  let direction = ''; 
  
  // Détecter la direction (droite/gauche)
  if (formatted.toLowerCase().includes('droite')) {
    direction = 'à droite';
  } else if (formatted.toLowerCase().includes('gauche')) {
    direction = 'à gauche';
  }

  // Simplifier les instructions pour les rendre plus claires
  
  // 1. Instructions de type "X tourne à direction et devient Y"
  if (formatted.match(/(.+) tourne (.+) et devient (.+)/i)) {
    formatted = formatted.replace(/(.+) tourne (à droite|à gauche|légèrement à droite|légèrement à gauche) et devient (.+)/i, 
      (match, street1, dir, street2) => {
        return `Continuez sur ${street2}`;
      });
  }
  
  // 2. Simplifier "Prendre la direction" en "Allez"
  formatted = formatted.replace(/Prendre la direction .+ sur (.+)/i, 'Allez sur $1');
  
  // 3. Simplifier les instructions au rond-point
  formatted = formatted.replace(/Au rond-point, prendre la (\d+)e sortie sur (.+)/i, 
    'Au rond-point, prenez la $1e sortie sur $2');
  
  // 4. Simplifier les instructions de bretelles
  formatted = formatted.replace(/Prendre la bretelle (à droite|à gauche) vers (.+)/i, 
    'Prenez la bretelle $1 vers $2');
  
  // 5. Rejoindre une autoroute
  formatted = formatted.replace(/Rejoindre (.+) par la bretelle vers (.+)/i, 
    'Rejoignez $1 vers $2');
  
  // 6. Simplifier "Prendre à direction sur"
  formatted = formatted.replace(/Prendre (à droite|à gauche) sur (.+)/i, 
    'Tournez $1 sur $2');
  
  // 7. Simplifier les instructions "Prendre vers X"
  formatted = formatted.replace(/Prendre vers (.+) (légèrement )?(à droite|à gauche)/i, 
    'Prenez $2$3 vers $1');
  
  // 8. Simplifier les instructions de sortie
  formatted = formatted.replace(/Prendre la sortie (.+) en direction de (.+)/i, 
    'Prenez la sortie $1 vers $2');

  // 9. Simplifier "Continuer sur"
  formatted = formatted.replace(/Continuer sur (.+)/i, 'Continuez sur $1');
  
  // 10. Simplifier "Rester sur la voie"
  formatted = formatted.replace(/Rester sur la voie (.+) pour continuer sur (.+)Continuer de suivre (.+)/i, 
    'Restez sur la voie $1 et suivez $3');
  
  // Nettoyage et amélioration syntaxique
  formatted = formatted
    .replace(/\s+/g, ' ') // Nettoyer les espaces multiples
    .trim();
  
  // Capitaliser la première lettre
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  
  return formatted;
};

/**
 * Fonction pour formater les distances de manière intuitive
 */
const formatDistance = (distance) => {
  if (!distance && distance !== 0) return '';
  
  if (distance < 50) {
    return 'Maintenant';
  } else if (distance < 1000) {
    return `${Math.round(distance / 10) * 10} m`;
  } else {
    const km = (distance / 1000).toFixed(1);
    return `${km} km`;
  }
};

/**
 * Composant d'instructions de navigation amélioré
 */
const NavigationInstruction = ({ location, destination }) => {
  const [currentStep, setCurrentStep] = useState(null);
  const [nextStep, setNextStep] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Références pour gérer les mises à jour intelligentes
  const lastFetchTime = useRef(0);
  const lastPosition = useRef(null);
  const allSteps = useRef([]);
  const currentStepIndex = useRef(0);
  const fetchingTimeout = useRef(null);
  
  // Définir un seuil de distance minimal pour mettre à jour les instructions (en mètres)
  const MIN_DISTANCE_THRESHOLD = 20;
  // Définir un intervalle minimal entre les requêtes API (en millisecondes)
  const MIN_FETCH_INTERVAL = 10000; // 10 secondes
  
  // Calculer la distance entre deux points GPS
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en mètres
  };
  
  // Déterminer si la position actuelle nécessite une mise à jour des instructions
  const shouldUpdateInstructions = (currentLoc) => {
    if (!lastPosition.current) return true;
    
    // Calculer la distance depuis la dernière position où on a récupéré les instructions
    const distance = calculateDistance(
      lastPosition.current.latitude,
      lastPosition.current.longitude,
      currentLoc.latitude,
      currentLoc.longitude
    );
    
    // Vérifier si on a dépassé le seuil de distance ou l'intervalle de temps
    const timeSinceLastFetch = Date.now() - lastFetchTime.current;
    
    return distance > MIN_DISTANCE_THRESHOLD || timeSinceLastFetch > MIN_FETCH_INTERVAL;
  };
  
  // Essayer de mettre à jour l'étape actuelle en fonction de la position sans appeler l'API
  const updateCurrentStepFromPosition = (currentLoc) => {
    if (!allSteps.current || allSteps.current.length === 0) return false;
    
    // Parcourir les étapes et trouver celle la plus proche/pertinente
    let minDistance = Infinity;
    let closestStepIndex = currentStepIndex.current;
    
    // Ne vérifier que les étapes à partir de l'étape courante et quelques suivantes
    const maxStepToCheck = Math.min(
      currentStepIndex.current + 3, 
      allSteps.current.length
    );
    
    for (let i = currentStepIndex.current; i < maxStepToCheck; i++) {
      const step = allSteps.current[i];
      if (!step.start_location) continue;
      
      // Calculer la distance jusqu'au point de départ de l'étape
      const distToStart = calculateDistance(
        currentLoc.latitude,
        currentLoc.longitude,
        step.start_location.lat,
        step.start_location.lng
      );
      
      // Si nous sommes plus proches du début de cette étape
      if (distToStart < minDistance) {
        minDistance = distToStart;
        closestStepIndex = i;
      }
    }
    
    // Si l'étape la plus proche est différente de l'étape actuelle, mettre à jour
    if (closestStepIndex !== currentStepIndex.current) {
      currentStepIndex.current = closestStepIndex;
      setCurrentStep(allSteps.current[closestStepIndex]);
      setNextStep(
        closestStepIndex + 1 < allSteps.current.length 
          ? allSteps.current[closestStepIndex + 1] 
          : null
      );
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    const fetchNavigationSteps = async () => {
      if (!location?.coords || !destination) return;
      
      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      // Vérifier si on a besoin de mettre à jour les instructions
      if (!shouldUpdateInstructions(currentLoc)) {
        // Essayer de mettre à jour l'étape actuelle sans appeler l'API
        const updated = updateCurrentStepFromPosition(currentLoc);
        if (updated) return;
      }
      
      // Si un fetch est déjà programmé, l'annuler
      if (fetchingTimeout.current) {
        clearTimeout(fetchingTimeout.current);
      }
      
      // Programmer un nouveau fetch avec un petit délai pour éviter les appels trop fréquents
      fetchingTimeout.current = setTimeout(async () => {
        // Ne pas montrer le chargement pour les mises à jour pendant la navigation
        const showLoading = !currentStep;
        if (showLoading) setIsLoading(true);
        setError(null);

        try {
          const response = await axios.get(`${API_URL}/api/navigation/navigation-steps`, {
            params: {
              currentLat: currentLoc.latitude,
              currentLng: currentLoc.longitude,
              destinationLat: destination.latitude,
              destinationLng: destination.longitude
            }
          });

          if (response.data?.steps?.length > 0) {
            // Stocker toutes les étapes
            allSteps.current = response.data.steps;
            currentStepIndex.current = 0;
            
            // Mettre à jour les étapes actuelles
            setCurrentStep(response.data.steps[0]);
            
            // Récupérer également l'étape suivante si disponible
            if (response.data.steps.length > 1) {
              setNextStep(response.data.steps[1]);
            } else {
              setNextStep(null);
            }
            
            // Mettre à jour la référence de la dernière position
            lastPosition.current = currentLoc;
            lastFetchTime.current = Date.now();
          } else {
            setError('Aucune instruction de navigation disponible');
          }
        } catch (error) {
          console.error('Failed to fetch navigation steps:', error);
          // Si une erreur se produit mais qu'on a déjà des instructions, ne pas afficher l'erreur
          if (!currentStep) {
            setError('Erreur lors du chargement des instructions');
          }
        } finally {
          if (showLoading) setIsLoading(false);
        }
      }, 300); // Petit délai pour éviter les appels API trop fréquents

      return () => {
        if (fetchingTimeout.current) {
          clearTimeout(fetchingTimeout.current);
        }
      };
    };

    fetchNavigationSteps();
  }, [location?.coords?.latitude, location?.coords?.longitude, destination]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.loadingText}>Préparation de l'itinéraire...</Text>
      </View>
    );
  }

  if (error && !currentStep) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!currentStep) return null;

  return (
    <View style={styles.container}>
      <Icon 
        name={getDirectionIcon(currentStep.maneuver)} 
        size={32} 
        color="#3498db" 
      />
      <View style={styles.textContainer}>
        <Text style={styles.distance}>
          {formatDistance(currentStep.distance)}
        </Text>
        <Text style={styles.instruction}>
          {formatInstruction(currentStep.instruction)}
        </Text>
        {nextStep && (
          <Text style={styles.nextStep}>
            Ensuite: {formatInstruction(nextStep.instruction)}
          </Text>
        )}
      </View>
    </View>
  );
};

const getDirectionIcon = (maneuver) => {
  const icons = {
    'straight': 'arrow-upward',
    'turn-right': 'turn-right',
    'turn-left': 'turn-left',
    'ramp-left': 'subdirectory-arrow-left',
    'ramp-right': 'subdirectory-arrow-right',
    'merge': 'merge-type',
    'roundabout': 'rotate-right',
    'roundabout-right': 'rotate-right',
    'roundabout-left': 'rotate-left',
    'uturn': 'u-turn-right',
    'keep-right': 'fork-right',
    'keep-left': 'fork-left',
    'arrive': 'place'
  };
  return icons[maneuver] || 'arrow-upward';
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
    alignItems: 'flex-start',
  },
  distance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  instruction: {
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 4,
    textAlign: 'left',
  },
  nextStep: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    padding: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    padding: 10,
  },
  // Ajout d'un style pour l'indicateur de chargement
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NavigationInstruction;