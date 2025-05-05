import { useState, useRef } from 'react';
import React from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileSection from './ProfileSection';
import NavigationSettings from './NavigationSettings';

const { width } = Dimensions.get('window');

const FloatingMenu = ({ onTollPreferenceChange, avoidTolls, isNextToSearchBar = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const toggleMenu = () => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? -300 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
    setIsOpen(!isOpen);
  };

  // Si le menu est à côté de la SearchBar, on utilise un style différent
  if (isNextToSearchBar) {
    return (
      <>
        <TouchableOpacity 
          style={styles.searchBarMenuButton} 
          onPress={toggleMenu}
        >
          {/* Flèche vers la droite */}
          <Ionicons name="chevron-forward" size={24} color="#000" />
        </TouchableOpacity>
        
        {isOpen && (
          <Animated.View 
            style={[styles.slideMenu, {
              transform: [{ translateX: slideAnim }],
              paddingLeft: isOpen ? 20 : 0
            }]}
          >
            <ProfileSection />
            
            <NavigationSettings 
              avoidTolls={avoidTolls}
              onTollPreferenceChange={onTollPreferenceChange}
            />
          </Animated.View>
        )}
      </>
    );
  }

  // Rendu standard (position absolue)
  return (
    <Animated.View 
      style={[styles.slideMenu, {
        transform: [{ translateX: slideAnim }],
        paddingLeft: isOpen ? 20 : 0
      }]}
    >
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <View style={styles.iconContainer}>
          {/* Flèche vers la droite */}
          <Ionicons name="chevron-forward" size={24} color="#000" />
        </View>
      </TouchableOpacity>

      <ProfileSection />
      
      <NavigationSettings 
        avoidTolls={avoidTolls}
        onTollPreferenceChange={onTollPreferenceChange}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: '50%',
    right: -60,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    zIndex: 1002, // Augmenté pour être au-dessus de SearchBar (1001)
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // Augmenté pour Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // Style pour le bouton quand il est à côté de la SearchBar
  searchBarMenuButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 39,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6, // Augmenté
    zIndex: 1002, // Augmenté pour être au-dessus de SearchBar
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideMenu: {
    position: 'absolute',
    left: -20,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#FFFFFF',
    elevation: 6, // Augmenté
    zIndex: 1005, // Valeur plus élevée pour assurer qu'il est au-dessus de tout
  }
});

export default FloatingMenu;