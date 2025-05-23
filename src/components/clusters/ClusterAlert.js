import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAlertIcon, getAlertColor } from './ClusterUtils';

const ClusterAlert = ({ cluster, distance, onDismiss, onStillPresent }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cluster) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [cluster]);

  if (!cluster) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Icon 
          name={getAlertIcon(cluster.type)} 
          size={30} 
          color={getAlertColor(cluster.type)} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>⚠️ Attention!</Text>
          <Text style={styles.message}>
            {cluster.count} signalements {cluster.type.toLowerCase()}
            {'\n'}à {Math.round(distance)}m
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.stillPresentButton]}
            onPress={onStillPresent}
          >
            <Text style={styles.buttonText}>Encore présent</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.notPresentButton]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>Plus présent</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
  },
  stillPresentButton: {
    backgroundColor: '#f39c12',
  },
  notPresentButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  }
});

export default ClusterAlert;