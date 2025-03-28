import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileSection from './ProfileSection';
import NavigationSettings from './NavigationSettings';

const FloatingMenu = ({ onTollPreferenceChange, avoidTolls }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current; // Changed from -800

  const toggleMenu = () => {
    const slideToValue = isOpen ? -300 : 0; // Changed from -800
    Animated.spring(slideAnim, {
      toValue: slideToValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
    setIsOpen(!isOpen);
  };

  return (
    <Animated.View 
      style={[styles.slideMenu, {
        transform: [{ translateX: slideAnim }],
        paddingLeft: isOpen ? 20 : 0 // Add padding only when menu is open
      }]}
    >
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={toggleMenu}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="menu" size={24} color="#000" />
        </View>
      </TouchableOpacity>

      <ProfileSection 
        isLoggedIn={isLoggedIn}
        onLogin={() => console.log('Login pressed')}
      />
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
    top: '8%',
    right: -60,
    backgroundColor: '#FFFFFF', // Changed from #000000 to white
    padding: 0, // Removed padding to better control centering
    borderRadius: 25,
    zIndex: 1001,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    // Add shadow for better visibility
    elevation: 4, // For Android
    shadowColor: '#000', // For iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    elevation: 5,
    zIndex: 999,
  },
  profileSection: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 60, // Increased from 40 to give more space at top
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden', // Prevent image from overflowing
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  settingsButton: {
    padding: 10,
  }
});

export default FloatingMenu;