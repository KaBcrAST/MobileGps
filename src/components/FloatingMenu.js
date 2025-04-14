import { useState, useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileSection from './ProfileSection';
import NavigationSettings from './NavigationSettings';

const FloatingMenu = ({ onTollPreferenceChange, avoidTolls }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  return (
    <Animated.View 
      style={[styles.slideMenu, {
        transform: [{ translateX: slideAnim }],
        paddingLeft: isOpen ? 20 : 0
      }]}
    >
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    zIndex: 1001,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  }
});

export default FloatingMenu;