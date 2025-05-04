import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { API_URL } from '../../config/config';

/**
 * Fonction améliorée pour formater les instructions de navigation
 * Traite spécifiquement les cas présents dans la réponse API
 */
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
 * Composant d'instructions de navigation
 */
const NavigationInstruction = ({ location, destination }) => {
  const [currentStep, setCurrentStep] = useState(null);
  const [nextStep, setNextStep] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNavigationSteps = async () => {
      if (!location?.coords || !destination) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_URL}/api/navigation/navigation-steps`, {
          params: {
            currentLat: location.coords.latitude,
            currentLng: location.coords.longitude,
            destinationLat: destination.latitude,
            destinationLng: destination.longitude
          }
        });

        if (response.data?.steps?.length > 0) {
          setCurrentStep(response.data.steps[0]);
          // Récupérer également l'étape suivante si disponible
          if (response.data.steps.length > 1) {
            setNextStep(response.data.steps[1]);
          } else {
            setNextStep(null);
          }
        } else {
          setError('Aucune instruction de navigation disponible');
        }
      } catch (error) {
        console.error('Failed to fetch navigation steps:', error);
        setError('Erreur lors du chargement des instructions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNavigationSteps();
  }, [location?.coords?.latitude, location?.coords?.longitude, destination]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement des instructions...</Text>
      </View>
    );
  }

  if (error) {
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

/**
 * Fonction pour déterminer l'icône appropriée selon la manoeuvre
 */
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
  }
});

export default NavigationInstruction;