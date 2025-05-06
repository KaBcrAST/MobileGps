import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PredictionsList = ({ predictions, onSelectPrediction, style }) => {
  if (predictions.length === 0) return null;
  
  return (
    <ScrollView 
      style={[styles.predictionsContainer, style]}
      // Ajout de ces propriétés pour assurer que la ScrollView est interactive
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      {predictions.map((prediction) => (
        <TouchableOpacity
          key={prediction.place_id}
          style={styles.predictionItem}
          onPress={() => onSelectPrediction(prediction)}
        >
          <Icon name="place" size={20} color="#666" style={styles.placeIcon} />
          <Text style={styles.predictionText}>{prediction.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  predictionsContainer: {
    backgroundColor: 'white',
    maxHeight: 200,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10, // Augmenté davantage
    zIndex: 1010, // Augmenté davantage pour être sûr
    position: 'absolute', // Changé à absolute pour forcer la superposition
    top: 0, // Position depuis le haut du conteneur parent
    left: 0, // Position depuis la gauche du conteneur parent
    right: 0, // Étirement jusqu'à droite du conteneur parent
    overflow: 'visible', // Pour s'assurer que rien n'est coupé
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeIcon: {
    marginRight: 10,
  },
  predictionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default PredictionsList;