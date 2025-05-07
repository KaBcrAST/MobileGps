import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SearchInput = ({ 
  inputRef, 
  searchQuery, 
  onChangeText, 
  onFocus, 
  onClear 
}) => {
  // Ajoutons une fonction sécurisée pour gérer le nettoyage du texte
  const handleClear = () => {
    if (typeof onClear === 'function') {
      onClear();
    } else if (typeof onChangeText === 'function') {
      // Fallback au cas où onClear n'est pas défini
      onChangeText('');
    } else {
      console.warn("Ni onClear ni onChangeText ne sont des fonctions valides");
    }
  };

  return (
    <View style={styles.searchInputContainer}>
      <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
      <TextInput
        ref={inputRef}
        style={styles.searchInput}
        placeholder="Rechercher une destination..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={onChangeText}
        onFocus={onFocus}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity 
          onPress={handleClear}
          style={styles.clearButton}
        >
          <Icon name="clear" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default SearchInput;