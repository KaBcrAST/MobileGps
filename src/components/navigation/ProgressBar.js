import React, { useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const ProgressBar = ({ totalDistance, remainingDistance }) => {
  const progressPercent = useMemo(() => {
    if (!totalDistance || !remainingDistance || totalDistance <= 0) {
      return '0%';
    }
    
    const traveledDistance = totalDistance - remainingDistance;
    
    if (traveledDistance < 0) return '0%';
    
    if (traveledDistance > totalDistance) return '100%';
    
    const percent = (traveledDistance / totalDistance) * 100;
    return `${percent}%`;
  }, [totalDistance, remainingDistance]);

  return (
    <View style={styles.container}>
      <View 
        style={[styles.progress, { width: progressPercent }]} 
      />
      <View 
        style={[styles.indicator, { left: progressPercent }]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginVertical: 10,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgb(74, 58, 255)', 
    borderRadius: 2,
    height: '100%',
  },
  indicator: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgb(74, 58, 255)', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    transform: [{ translateX: -5 }],
  },
});

export default ProgressBar;