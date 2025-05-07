import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDistance, getArrivalTime } from '../../utils/formatters';

const RouteDetails = ({ duration, distance }) => {
  return (
    <View style={styles.container}>
      <View style={styles.arrivalSection}>
        <Text style={styles.arrivalLabel}>Arrivée à</Text>
        <Text style={styles.arrivalTime}>{getArrivalTime(duration)}</Text>
      </View>
      
      <View style={styles.distanceSection}>
        <Text style={styles.distanceValue}>{formatDistance(distance)}</Text>
        <Icon name="map-marker-distance" size={16} color="#666" style={styles.distanceIcon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 15,
  },
  arrivalSection: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  arrivalLabel: {
    fontSize: 12,
    color: '#666',
  },
  arrivalTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  distanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
  },
  distanceIcon: {
    marginTop: 2,
  },
});

export default RouteDetails;