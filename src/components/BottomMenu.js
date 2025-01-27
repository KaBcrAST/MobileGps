import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const BottomMenu = ({ onExpand, isExpanded }) => {
  const height = useSharedValue('40%');

  useEffect(() => {
    height.value = withTiming(isExpanded ? '100%' : '40%', {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  const handleFocus = () => {
    if (!isExpanded) {
      onExpand(true);
    }
  };

  const handleClose = () => {
    onExpand(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity style={styles.closeBar} onPress={handleClose}>
          <View style={styles.closeBarLine} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, isExpanded ? styles.inputExpanded : styles.inputCollapsed]}
          placeholder="Lieu d'arrivée"
          onFocus={handleFocus}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  inputCollapsed: {
    marginTop: 60, // Position du champ lorsque le menu est à 40% de hauteur
  },
  inputExpanded: {
    marginTop: 80, // Position du champ lorsque le menu est à 100% de hauteur
  },
  closeBar: {
    position: 'absolute',
    top: 20, // Ajuster la position de la barre
    left: '50%',
    transform: [{ translateX: -20 }],
  },
  closeBarLine: {
    width: 40,
    height: 5,
    backgroundColor: '#000', // Changer la couleur en noir
    borderRadius: 2.5,
  },
});

export default BottomMenu;