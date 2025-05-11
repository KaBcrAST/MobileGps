import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { isSoundEnabled, setSoundEnabled } from '../services/trackService';
import FavoritesListComponent from './FavoritesListComponent';

const SOUND_ENABLED_KEY = 'soundEnabled';
const FAVORITES_AUTO_SYNC_KEY = 'favoritesAutoSync';
const FAVORITES_SORT_BY_KEY = 'favoritesSortBy';
const THEME_COLOR = 'rgb(74, 58, 255)';

const NavigationSettings = ({ onTollPreferenceChange, onRouteSelected = null }) => {
  const navigation = useNavigation();
  
  const [isTollDropdownOpen, setIsTollDropdownOpen] = useState(false);
  const [isSoundDropdownOpen, setIsSoundDropdownOpen] = useState(false);
  const [isFavoritesDropdownOpen, setIsFavoritesDropdownOpen] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [favoritesAutoSync, setFavoritesAutoSync] = useState(true);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  useEffect(() => {
    loadTollPreference();
    loadSoundPreference();
    loadFavoritesPreferences();
  }, []);

  const loadTollPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem('avoidTolls');
      if (savedPreference !== null) {
        setAvoidTolls(JSON.parse(savedPreference));
      }
    } catch (error) {
    }
  };

  const loadSoundPreference = async () => {
    try {
      const isEnabled = await isSoundEnabled();
      setSoundEnabledState(isEnabled);
    } catch (error) {
    }
  };

  const loadFavoritesPreferences = async () => {
    try {
      const autoSync = await AsyncStorage.getItem(FAVORITES_AUTO_SYNC_KEY);
      if (autoSync !== null) {
        setFavoritesAutoSync(JSON.parse(autoSync));
      }
    } catch (error) {
    }
  };

  const handleTollPress = () => {
    setIsTollDropdownOpen(!isTollDropdownOpen);
    if (!isTollDropdownOpen) {
      setIsSoundDropdownOpen(false);
      setIsFavoritesDropdownOpen(false);
    }
  };

  const handleSoundPress = () => {
    setIsSoundDropdownOpen(!isSoundDropdownOpen);
    if (!isSoundDropdownOpen) {
      setIsTollDropdownOpen(false);
      setIsFavoritesDropdownOpen(false);
    }
  };

  const handleFavoritesPress = () => {
    setShowFavoritesModal(true);
  };

  const handleTollToggle = async (value) => {
    setAvoidTolls(value);
    try {
      await AsyncStorage.setItem('avoidTolls', JSON.stringify(value));
      if (onTollPreferenceChange) {
        onTollPreferenceChange(value);
      }
    } catch (error) {
    }
  };

  const handleSoundToggle = async (value) => {
    try {
      setSoundEnabledState(value);
      await setSoundEnabled(value);
    } catch (error) {
    }
  };

  const handleFavoritesAutoSyncToggle = async (value) => {
    try {
      setFavoritesAutoSync(value);
      await AsyncStorage.setItem(FAVORITES_AUTO_SYNC_KEY, JSON.stringify(value));
    } catch (error) {
    }
  };

  const handleSelectRoute = (routeData) => {
    setShowFavoritesModal(false);
    
    if (!routeData || !routeData.route) {
      Alert.alert("Erreur", "Données d'itinéraire incomplètes");
      return;
    }
    
    if (onRouteSelected) {
      onRouteSelected(routeData);
      return;
    }
    
    try {
      navigation.navigate('Map', {
        routeData: routeData,
        destination: {
          latitude: routeData.latitude,
          longitude: routeData.longitude,
          name: routeData.name,
          address: routeData.address
        },
        startNavigation: true,
        showRoutePreview: false,
        navigationMode: true,
        autoStart: true
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de naviguer vers cette destination");
    }
  };

  const handleSyncFavorites = () => {
    setShowFavoritesModal(true);
  };

  const handleCloseFavoritesModal = () => {
    setShowFavoritesModal(false);
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
                trackColor={{ false: "#767577", true: THEME_COLOR }}
                thumbColor={avoidTolls ? THEME_COLOR : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                accessible={true}
                accessibilityLabel={avoidTolls ? "Ne pas éviter les péages" : "Éviter les péages"}
                accessibilityHint="Double-tapez pour modifier votre préférence concernant les péages"
              />
            </View>
          </View>
        )}
      </View>
      
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
                trackColor={{ false: "#767577", true: THEME_COLOR }}
                thumbColor={soundEnabled ? THEME_COLOR : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                accessible={true}
                accessibilityLabel={soundEnabled ? "Désactiver les sons" : "Activer les sons"}
                accessibilityHint="Double-tapez pour activer ou désactiver les sons de l'application"
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.menuSeparator}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={handleFavoritesPress}
        >
          <View style={styles.settingContent}>
            <Ionicons name="star-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Mes favoris</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFavoritesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseFavoritesModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mes favoris</Text>
            <TouchableOpacity 
              onPress={handleCloseFavoritesModal}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {showFavoritesModal && (
            <FavoritesListComponent 
              onSelectRoute={handleSelectRoute}
              onClose={handleCloseFavoritesModal}
            />
          )}
        </View>
      </Modal>
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
  },
  favoriteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    marginTop: 4,
  },
  favoriteActionText: {
    fontSize: 15,
    color: THEME_COLOR,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
  },
});

export default NavigationSettings;