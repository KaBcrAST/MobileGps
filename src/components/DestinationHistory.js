import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLocalHistory, removeFromLocalHistory } from '../services/localHistoryService';

const DestinationHistory = ({ onSelectDestination, style }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const localHistory = await getLocalHistory();
      setHistory(localHistory);
    } catch (error) {
      console.error('Error loading local history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (timestamp) => {
    const updatedHistory = await removeFromLocalHistory(timestamp);
    setHistory(updatedHistory);
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <TouchableOpacity 
        style={styles.itemContent}
        onPress={() => onSelectDestination(item)}
      >
        <Ionicons name="location" size={24} color="#4285f4" />
        <View style={styles.textContainer}>
          <Text style={styles.destinationName}>
            {item.name || 'Destination inconnue'}
          </Text>
          <Text style={styles.address} numberOfLines={2}>
            {item.address || 'Adresse non disponible'}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleRemoveItem(item.timestamp)}
      >
        <Ionicons name="close" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Destinations récentes</Text>
      {history.length === 0 ? (
        <Text style={styles.emptyText}>Aucun historique disponible</Text>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.timestamp?.toString() || index.toString()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10, // Reduced padding
    maxHeight: 200, // Reduced max height
  },
  title: {
    fontSize: 14, // Smaller font
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, // Reduced padding
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  destinationName: {
    fontSize: 14, // Smaller font
    fontWeight: '500',
    color: '#333',
  },
  address: {
    fontSize: 12, // Smaller font
    color: '#666',
    marginTop: 1,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    padding: 20,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  }
});

export default DestinationHistory;