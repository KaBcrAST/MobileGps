import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';

const DIRECTION_ICONS = {
  straight: 'arrow-up',
  continue: 'arrow-up',
  right: 'arrow-forward',
  'turn-right': 'arrow-forward',
  left: 'arrow-back',
  'turn-left': 'arrow-back',
  'slight-right': 'arrow-up-circle',
  'slight-left': 'arrow-up-circle',
  'uturn-right': 'refresh-circle',
  'uturn-left': 'refresh-circle'
};

const getDirectionIcon = (maneuver) => 
  DIRECTION_ICONS[maneuver?.toLowerCase()] || 'arrow-up';

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