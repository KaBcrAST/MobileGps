import React, { useState } from 'react';
import { View, TextInput, Animated, Dimensions, TouchableOpacity, ScrollView, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api/search';
const windowHeight = Dimensions.get('window').height;

const SearchBar = ({ onPlaceSelect }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const animatedPosition = new Animated.Value(0);

  const toggleSearchPosition = (focused) => {
    setIsSearchFocused(focused);
    if (!focused) {
      setPredictions([]);
    }
    Animated.spring(animatedPosition, {
      toValue: focused ? -windowHeight * 0.8 : 0,
      useNativeDriver: true,
      tension: 20,
      friction: 7
    }).start();
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setPredictions([]);
      return;
    }
    
    try {
      const { data: predictions } = await axios.get(`${API_URL}/places`, {
        params: { query }
      });
      setPredictions(predictions);
    } catch {
      setPredictions([]);
    }
  };

  const handleSelectPlace = async (prediction) => {
    try {
      setSearchQuery(prediction.description);
      setPredictions([]);
      toggleSearchPosition(false);

      const { data: details } = await axios.get(`${API_URL}/places/${prediction.place_id}`);
      
      if (details?.geometry?.location) {
        const destination = {
          name: details.name || prediction.structured_formatting?.main_text || prediction.description,
          address: details.formatted_address || prediction.description,
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
        };
        onPlaceSelect(destination);
      }
    } catch {
      setSearchQuery('');
      setPredictions([]);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.searchContainer,
        { transform: [{ translateY: animatedPosition }] }
      ]}
    >
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une destination..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => toggleSearchPosition(true)}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setPredictions([]);
            }}
            style={styles.clearButton}
          >
            <Icon name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {predictions.length > 0 && (
        <ScrollView style={styles.predictionsContainer}>
          {predictions.map((prediction) => (
            <TouchableOpacity
              key={prediction.place_id}
              style={styles.predictionItem}
              onPress={() => handleSelectPlace(prediction)}
            >
              <Icon name="place" size={20} color="#666" style={styles.placeIcon} />
              <Text style={styles.predictionText}>{prediction.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = {
  searchContainer: {
    position: 'absolute',
    top: '8%',
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  predictionsContainer: {
    backgroundColor: 'white',
    maxHeight: 200,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  }
};

export default SearchBar;