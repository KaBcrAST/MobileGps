import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Speedometer from './Speedometer';
import { formatDistance, formatValue } from '../../utils/formatters';

const SimpleView = ({ speed, routeInfo }) => {
  return (
    <View style={styles.container}>
      <Speedometer speed={speed} />
      
      {routeInfo && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoText}>
            Distance: {formatDistance(routeInfo.distance)}
          </Text>
          <Text style={styles.routeInfoText}>
            Durée: {formatValue(routeInfo.duration)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  routeInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  routeInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});

export default SimpleView;