import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatValue } from '../../utils/formatters';

const DurationInfo = ({ duration }) => {
  return (
    <View style={styles.container}>
      <Icon name="clock-outline" size={18} color="#666" />
      <Text style={styles.text}>
        {formatValue(duration) || '-- min'} restantes
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  text: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
});

export default DurationInfo;