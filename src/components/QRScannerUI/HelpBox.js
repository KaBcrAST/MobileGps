import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HelpBox = () => {
  return (
    <View style={styles.helpBox}>
      <Text style={styles.helpTitle}>Comment utiliser :</Text>
      <Text style={styles.helpText}>1. Prenez une photo d'un QR code ou sélectionnez une image</Text>
      <Text style={styles.helpText}>2. Patientez pendant l'analyse du QR code</Text>
      <Text style={styles.helpText}>3. La navigation démarrera automatiquement si le QR contient des coordonnées valides</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  helpBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#9e9e9e',
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 5,
  },
});

export default HelpBox;