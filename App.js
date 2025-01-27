import React from 'react';
import { View } from 'react-native';
import MapScreen from './src/screens/MapScreen';
import styles from './src/styles/globalStyles';

export default function App() {
  return (
    <View style={styles.container}>
      <MapScreen />
    </View>
  );
}