import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importer les fonctions du service audio
import { isSoundEnabled, setSoundEnabled } from '../services/trackService';

// Clé pour stocker la préférence sonore
const SOUND_ENABLED_KEY = 'soundEnabled';

const NavigationSettings = ({ onTollPreferenceChange }) => {
  const [isTollDropdownOpen, setIsTollDropdownOpen] = useState(false);
  const [isSoundDropdownOpen, setIsSoundDropdownOpen] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);

  // Charger les préférences au démarrage
  useEffect(() => {
    loadTollPreference();
    loadSoundPreference();
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

  const loadSoundPreference = async () => {
    try {
      // Utiliser la fonction du service pour vérifier l'état sonore
      const isEnabled = await isSoundEnabled();
      setSoundEnabledState(isEnabled);
    } catch (error) {
      console.error('Error loading sound preference:', error);
    }
  };

  const handleTollPress = () => {
    setIsTollDropdownOpen(!isTollDropdownOpen);
    // Fermer l'autre menu si ouvert
    if (!isTollDropdownOpen && isSoundDropdownOpen) {
      setIsSoundDropdownOpen(false);
    }
  };

  const handleSoundPress = () => {
    setIsSoundDropdownOpen(!isSoundDropdownOpen);
    // Fermer l'autre menu si ouvert
    if (!isSoundDropdownOpen && isTollDropdownOpen) {
      setIsTollDropdownOpen(false);
    }
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

  const handleSoundToggle = async (value) => {
    try {
      // Mettre à jour l'état local
      setSoundEnabledState(value);
      
      // Utiliser la fonction du service pour définir l'état sonore
      await setSoundEnabled(value);
      
      console.log(`🔊 Sons ${value ? 'activés' : 'désactivés'}`);
    } catch (error) {
      console.error('Error saving sound preference:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Paramètres Navigation</Text>
      
      {/* Section Péages */}
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
                ios_backgroundColor="#3e3e3e"
                accessible={true}
                accessibilityLabel={avoidTolls ? "Ne pas éviter les péages" : "Éviter les péages"}
                accessibilityHint="Double-tapez pour modifier votre préférence concernant les péages"
              />
            </View>
          </View>
        )}
      </View>
      
      {/* Section Sons */}
      <View style={styles.menuSeparator}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={handleSoundPress}
        >
          <View style={styles.settingContent}>
            <Ionicons 
              name={soundEnabled ? "volume-high-outline" : "volume-mute-outline"} 
              size={24} 
              color="#333" 
            />
            <Text style={styles.settingText}>Sons</Text>
          </View>
          <Ionicons 
            name={isSoundDropdownOpen ? "chevron-down" : "chevron-forward"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>

        {isSoundDropdownOpen && (
          <View style={styles.dropdownContent}>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleText}>Activer les sons</Text>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={soundEnabled ? "#2196F3" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                accessible={true}
                accessibilityLabel={soundEnabled ? "Désactiver les sons" : "Activer les sons"}
                accessibilityHint="Double-tapez pour activer ou désactiver les sons de l'application"
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
  },
  menuSeparator: {
    marginTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  }
});

export default NavigationSettings;