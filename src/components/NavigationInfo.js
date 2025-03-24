import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';

const getDirectionIcon = (maneuver) => {
  if (!maneuver) return 'arrow-up';
  
  switch(maneuver.toLowerCase()) {
    case 'straight':
    case 'continue':
      return 'arrow-up';
    case 'turn-right':
    case 'right':
      return 'arrow-forward';
    case 'turn-left':
    case 'left':
      return 'arrow-back';
    case 'slight-right':
      return 'arrow-up-circle';
    case 'slight-left':
      return 'arrow-up-circle';
    case 'uturn-right':
    case 'uturn-left':
      return 'refresh-circle';
    default:
      return 'arrow-up';
  }
};

const NavigationInfo = ({ nextStep }) => (
  <View style={styles.directionsContainer}>
    {nextStep && (
      <View style={styles.directionBox}>
        <Ionicons 
          name={getDirectionIcon(nextStep.maneuver)} 
          size={50} 
          color="white" 
        />
        <Text style={styles.distanceText}>
          {nextStep.distance}m
        </Text>
      </View>
    )}
  </View>
);

export default NavigationInfo;