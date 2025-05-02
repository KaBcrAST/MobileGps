import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { API_URL } from '../../config/config';

const formatInstruction = (instruction) => {
  if (!instruction) return 'Continuez tout droit';

  let formatted = instruction;

  // Gérer d'abord les actions spécifiques
  const actionReplacements = {
    'Turn right onto': 'Tournez à droite sur',
    'Turn right': 'Tournez à droite',
    'Turn left onto': 'Tournez à gauche sur',
    'Turn left': 'Tournez à gauche',
    'Continue onto': 'Continuez sur',
    'Continue straight': 'Continuez sur'
  };

  // Appliquer les remplacements d'actions
  Object.entries(actionReplacements).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(key, 'gi'), value);
  });

  // Supprimer les mentions de voies à accès limité
  formatted = formatted
    .replace(/voie [àa] acc[èe]s (limité|restreint)[e]?/gi, '')
    .replace(/restricted access road/gi, '')
    .replace(/access road/gi, '');

  // Supprimer les directions cardinales et mots inutiles
  const wordsToRemove = [
    'Prendre la direction',
    'Head',
    'vers le nord',
    'vers le sud',
    'vers l\'est',
    'vers l\'ouest',
    'direction nord',
    'direction sud',
    'direction est',
    'direction ouest',
    'nord',
    'sud',
    'est',
    'ouest'
  ];

  wordsToRemove.forEach(word => {
    formatted = formatted.replace(new RegExp(word, 'gi'), '');
  });

  // Nettoyage final
  formatted = formatted
    .replace(/\s+/g, ' ')
    .trim();

  // Si l'instruction est vide après nettoyage
  if (!formatted || formatted === ' ' || formatted === 'ou') {
    formatted = 'Continuez tout droit';
  }

  return formatted;
};

const NavigationInstruction = ({ location, destination }) => {
  const [currentStep, setCurrentStep] = useState(null);

  useEffect(() => {
    const fetchNavigationSteps = async () => {
      if (!location?.coords || !destination) return;

      try {
        const response = await axios.get(`${API_URL}/navigation/navigation-steps`, {
          params: {
            currentLat: location.coords.latitude,
            currentLng: location.coords.longitude,
            destinationLat: destination.latitude,
            destinationLng: destination.longitude
          }
        });

        if (response.data?.steps?.length > 0) {
          setCurrentStep(response.data.steps[0]);
        }
      } catch (error) {
        console.error('Failed to fetch navigation steps:', error);
      }
    };

    fetchNavigationSteps();
  }, [location?.coords?.latitude, location?.coords?.longitude]);

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
          {currentStep.distance >= 1000 
            ? `${(currentStep.distance / 1000).toFixed(1)} km` 
            : `${currentStep.distance} m`}
        </Text>
        <Text style={styles.instruction}>
          {formatInstruction(currentStep.instruction)}
        </Text>
      </View>
    </View>
  );
};

const getDirectionIcon = (maneuver) => {
  const icons = {
    'turn-right': 'turn-right',
    'turn-left': 'turn-left',
    'ramp-left': 'subdirectory-arrow-left',
    'ramp-right': 'subdirectory-arrow-right',
    'straight': 'straight',
    'merge': 'merge-type',
    'roundabout': 'rotate-right'
  };
  return icons[maneuver] || 'straight';
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
    alignItems: 'center',
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
    textAlign: 'center',
  }
});

export default NavigationInstruction;