import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { API_URL } from '../../config/config';

const formatInstruction = (instruction) => {
  if (!instruction) return 'Continuez tout droit';

  let formatted = instruction;
  let direction = ''; 
  
  if (formatted.toLowerCase().includes('droite')) {
    direction = 'à droite';
  } else if (formatted.toLowerCase().includes('gauche')) {
    direction = 'à gauche';
  }
  
  if (formatted.match(/(.+) tourne (.+) et devient (.+)/i)) {
    formatted = formatted.replace(/(.+) tourne (à droite|à gauche|légèrement à droite|légèrement à gauche) et devient (.+)/i, 
      (match, street1, dir, street2) => {
        return `Continuez sur ${street2}`;
      });
  }
  
  formatted = formatted.replace(/Prendre la direction .+ sur (.+)/i, 'Allez sur $1');
  
  formatted = formatted.replace(/Au rond-point, prendre la (\d+)e sortie sur (.+)/i, 
    'Au rond-point, prenez la $1e sortie sur $2');
  
  formatted = formatted.replace(/Prendre la bretelle (à droite|à gauche) vers (.+)/i, 
    'Prenez la bretelle $1 vers $2');
  
  formatted = formatted.replace(/Rejoindre (.+) par la bretelle vers (.+)/i, 
    'Rejoignez $1 vers $2');
  
  formatted = formatted.replace(/Prendre (à droite|à gauche) sur (.+)/i, 
    'Tournez $1 sur $2');
  
  formatted = formatted.replace(/Prendre vers (.+) (légèrement )?(à droite|à gauche)/i, 
    'Prenez $2$3 vers $1');
  
  formatted = formatted.replace(/Prendre la sortie (.+) en direction de (.+)/i, 
    'Prenez la sortie $1 vers $2');

  formatted = formatted.replace(/Continuer sur (.+)/i, 'Continuez sur $1');
  
  formatted = formatted.replace(/Rester sur la voie (.+) pour continuer sur (.+)Continuer de suivre (.+)/i, 
    'Restez sur la voie $1 et suivez $3');
  
  formatted = formatted
    .replace(/\s+/g, ' ') 
    .trim();
  
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  
  return formatted;
};

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

const NavigationInstruction = ({ location, destination }) => {
  const [currentStep, setCurrentStep] = useState(null);
  const [nextStep, setNextStep] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const lastFetchTime = useRef(0);
  const lastPosition = useRef(null);
  const allSteps = useRef([]);
  const currentStepIndex = useRef(0);
  const fetchingTimeout = useRef(null);
  
  const MIN_DISTANCE_THRESHOLD = 20;
  const MIN_FETCH_INTERVAL = 10000; 
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const shouldUpdateInstructions = (currentLoc) => {
    if (!lastPosition.current) return true;
    
    const distance = calculateDistance(
      lastPosition.current.latitude,
      lastPosition.current.longitude,
      currentLoc.latitude,
      currentLoc.longitude
    );
    
    const timeSinceLastFetch = Date.now() - lastFetchTime.current;
    
    return distance > MIN_DISTANCE_THRESHOLD || timeSinceLastFetch > MIN_FETCH_INTERVAL;
  };
  
  const updateCurrentStepFromPosition = (currentLoc) => {
    if (!allSteps.current || allSteps.current.length === 0) return false;
    
    let minDistance = Infinity;
    let closestStepIndex = currentStepIndex.current;
    
    const maxStepToCheck = Math.min(
      currentStepIndex.current + 3, 
      allSteps.current.length
    );
    
    for (let i = currentStepIndex.current; i < maxStepToCheck; i++) {
      const step = allSteps.current[i];
      if (!step.start_location) continue;
      
      const distToStart = calculateDistance(
        currentLoc.latitude,
        currentLoc.longitude,
        step.start_location.lat,
        step.start_location.lng
      );
      
      if (distToStart < minDistance) {
        minDistance = distToStart;
        closestStepIndex = i;
      }
    }
    
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
      
      if (!shouldUpdateInstructions(currentLoc)) {
        const updated = updateCurrentStepFromPosition(currentLoc);
        if (updated) return;
      }
      
      if (fetchingTimeout.current) {
        clearTimeout(fetchingTimeout.current);
      }
      
      fetchingTimeout.current = setTimeout(async () => {
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
            allSteps.current = response.data.steps;
            currentStepIndex.current = 0;
            
            setCurrentStep(response.data.steps[0]);
            
            if (response.data.steps.length > 1) {
              setNextStep(response.data.steps[1]);
            } else {
              setNextStep(null);
            }
            
            lastPosition.current = currentLoc;
            lastFetchTime.current = Date.now();
          } else {
            setError('Aucune instruction de navigation disponible');
          }
        } catch (error) {
          console.error('Failed to fetch navigation steps:', error);
          if (!currentStep) {
            setError('Erreur lors du chargement des instructions');
          }
        } finally {
          if (showLoading) setIsLoading(false);
        }
      }, 300); 

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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NavigationInstruction;