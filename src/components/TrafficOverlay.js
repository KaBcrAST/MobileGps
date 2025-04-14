import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TrafficOverlay = ({ trafficInfo }) => {
  if (!trafficInfo?.route?.segments) return null;

  const trafficSegments = trafficInfo.route.segments.filter(
    segment => segment.hasTrafficIssue
  );

  if (trafficSegments.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="traffic-light" size={24} color="#dc2626" />
        <Text style={styles.title}>Zones de trafic dense</Text>
      </View>
      {trafficSegments.map((segment, index) => (
        <View key={index} style={styles.alertCard}>
          <Icon name="car-brake-alert" size={20} color="#dc2626" />
          <View style={styles.alertContent}>
            <Text style={styles.alertText}>
              Bouchon détecté à {Math.round(segment.distance / 1000)}km
            </Text>
            {segment.reports?.length > 0 && (
              <Text style={styles.reportCount}>
                {segment.reports.length} signalement{segment.reports.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1f2937',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  alertContent: {
    marginLeft: 10,
    flex: 1,
  },
  alertText: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '500',
  },
  reportCount: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
  }
});

export default TrafficOverlay;