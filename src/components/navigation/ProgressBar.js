import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const ProgressBar = ({ progressPercent }) => {
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.progress, { width: progressPercent }]} 
      />
      <Animated.View 
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
    backgroundColor: '#1A73E8',
    borderRadius: 2,
    height: '100%',
  },
  indicator: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A73E8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    transform: [{ translateX: -5 }],
  },
});

export default ProgressBar;