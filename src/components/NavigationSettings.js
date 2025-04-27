import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NavigationSettings = ({ onTollPreferenceChange }) => {
  const [isTollDropdownOpen, setIsTollDropdownOpen] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    loadTollPreference();
  }, []);

  const loadTollPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem('avoidTolls');
      if (savedPreference !== null) {
        setAvoidTolls(JSON.parse(savedPreference));
      }
    } catch (error) {
      console.error('Error loading toll preference:', error);
    }
  };

  const handleTollPress = () => {
    setIsTollDropdownOpen(!isTollDropdownOpen);
  };

  const handleTollToggle = async (value) => {
    setAvoidTolls(value);
    try {
      await AsyncStorage.setItem('avoidTolls', JSON.stringify(value));
      // Notify parent component about the change
      if (onTollPreferenceChange) {
        onTollPreferenceChange(value);
      }
    } catch (error) {
      console.error('Error saving toll preference:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Paramètres Navigation</Text>
      
      <View>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={handleTollPress}
        >
          <View style={styles.settingContent}>
            <Ionicons name="cash-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Péages</Text>
          </View>
          <Ionicons 
            name={isTollDropdownOpen ? "chevron-down" : "chevron-forward"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>

        {isTollDropdownOpen && (
          <View style={styles.dropdownContent}>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleText}>Éviter les péages</Text>
              <Switch
                value={avoidTolls}
                onValueChange={handleTollToggle}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={avoidTolls ? "#2196F3" : "#f4f3f4"}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dropdownContent: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 36,
    borderRadius: 8,
    marginBottom: 8,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 15,
    color: '#333',
  }
});

export default NavigationSettings;