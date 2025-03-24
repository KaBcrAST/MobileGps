import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SpeedDisplay = ({ speed, routeInfo, isNavigating }) => {
  console.log('SpeedDisplay props:', { speed, routeInfo, isNavigating });
  console.log('Route distance:', routeInfo?.distance?.value);

  return (
    <>
      <View style={styles.speedMeter}>
        <Text style={styles.speedText}>{Math.round(speed)}</Text>
        <Text style={styles.unitText}>km/h</Text>
      </View>

      <View style={styles.whiteBar}>
        <Text style={styles.welcomeText}>Bonjour</Text>
        {isNavigating && routeInfo?.distance?.value && (
          <Text style={styles.distanceText}>
            {(routeInfo.distance.value / 1000).toFixed(1)} km restants
          </Text>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  speedMeter: {
    position: 'absolute',
    bottom: '15%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  speedText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  unitText: {
    color: 'white',
    fontSize: 16,
    marginTop: -5,
  },
  whiteBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  distanceText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '500',
    marginTop: 5,
  }
});

export default SpeedDisplay;