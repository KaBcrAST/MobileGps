import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTraffic } from '../hooks/useTraffic';

const TrafficInfo = ({ location, destination }) => {
  const { trafficInfo, loading, error } = useTraffic(location, destination);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Icon name="alert" size={24} color="#dc2626" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!trafficInfo) return null;

  const { summary, segments } = trafficInfo.route;
  const trafficAlerts = segments.filter(s => s.hasTrafficIssue);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Icon 
          name={summary.hasTrafficIssues ? "traffic-light-red" : "traffic-light-green"} 
          size={24} 
          color={summary.hasTrafficIssues ? "#dc2626" : "#22c55e"}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.mainText}>{summary.distance} • {summary.duration}</Text>
          {trafficAlerts.length > 0 && (
            <Text style={styles.alertText}>
              {trafficAlerts.length} zone{trafficAlerts.length > 1 ? 's' : ''} de ralentissement
            </Text>
          )}
        </View>
      </View>
      
      {trafficAlerts.map((segment, index) => (
        <View key={index} style={styles.alertCard}>
          <Icon name="car-brake-alert" size={20} color="#dc2626" />
          <Text style={styles.alertDetailText}>
            Trafic dense à {segment.distance}
          </Text>
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
    zIndex: 999,
  },
  card: {
    backgroundColor: 'black',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 8,
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  alertText: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertDetailText: {
    marginLeft: 8,
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    marginLeft: 8,
    color: '#dc2626',
    fontSize: 14,
  }
});

export default TrafficInfo;