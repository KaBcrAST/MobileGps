import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TrafficInfo = ({ traffic }) => {
  if (!traffic?.hasSlowdowns) return null;
  
  return (
    <View style={styles.container}>
      <Icon name="traffic-light" size={18} color="#FF8800" />
      <Text style={styles.text}>
        +{traffic.slowdownDuration?.text || "0 min"} de ralentissement
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 8,
  },
  text: {
    color: '#FF8800',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default TrafficInfo;