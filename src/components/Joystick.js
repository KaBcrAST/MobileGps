import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import PropTypes from 'prop-types';

const Joystick = ({
  size = 150,
  innerSize = 80,
  outerColor = 'rgba(0, 0, 0, 0.2)',
  innerColor = 'rgba(52, 152, 219, 0.8)',
  onMove = () => {},
  onRelease = () => {},
  disabled = false
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [showDebug] = useState(false);
  const [angle, setAngle] = useState(0);
  const [distance, setDistance] = useState(0);

  // Calculer les limites du joystick
  const centerPoint = { x: size / 2, y: size / 2 };
  const maxDistance = (size - innerSize) / 2;

  // Configurer le PanResponder pour gérer les gestes de toucher
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      
      onPanResponderGrant: () => {
        // Aucune action nécessaire au début du geste
      },
      
      onPanResponderMove: (_, gesture) => {
        // Calculer la position relative au centre du joystick
        const x = gesture.moveX - gesture.x0 + pan.x._value;
        const y = gesture.moveY - gesture.y0 + pan.y._value;
        
        // Calculer la distance par rapport au centre
        const newDistance = Math.min(
          Math.sqrt(x * x + y * y) / maxDistance, 
          1
        );
        
        // Calculer l'angle en degrés (0 = droite, va dans le sens des aiguilles d'une montre)
        const newAngle = Math.atan2(y, x) * 180 / Math.PI;
        const normalizedAngle = (newAngle + 360) % 360;
        
        // Limiter le mouvement à un cercle
        const limitedX = Math.cos(normalizedAngle * Math.PI / 180) * newDistance * maxDistance;
        const limitedY = Math.sin(normalizedAngle * Math.PI / 180) * newDistance * maxDistance;
        
        // Mettre à jour la position animée
        pan.setValue({ x: limitedX, y: limitedY });
        
        // Mettre à jour les valeurs d'angle et de distance
        setAngle(normalizedAngle);
        setDistance(newDistance);
        
        // Appeler le callback avec les données
        onMove({ 
          angle: normalizedAngle, 
          distance: newDistance,
          x: limitedX / maxDistance,  // Normaliser entre -1 et 1
          y: limitedY / maxDistance   // Normaliser entre -1 et 1
        });
      },
      
      onPanResponderRelease: () => {
        // Revenir à la position centrale avec animation
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false
        }).start();
        
        // Réinitialiser les valeurs
        setAngle(0);
        setDistance(0);
        
        // Appeler le callback de relâchement
        onRelease();
      }
    })
  ).current;

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: outerColor 
        }
      ]}
    >
      {/* Zone extérieure du joystick */}
      <View style={styles.joystickWrapper} {...panResponder.panHandlers}>
        {/* Joystick central (se déplace) */}
        <Animated.View 
          style={[
            styles.joystickInner,
            { 
              width: innerSize, 
              height: innerSize, 
              borderRadius: innerSize / 2,
              backgroundColor: innerColor,
              transform: [
                { translateX: pan.x },
                { translateY: pan.y }
              ]
            }
          ]}
        />
      </View>
      
      {/* Affichage des valeurs pour le débogage (optionnel) */}
      {showDebug && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Angle: {Math.round(angle)}°
          </Text>
          <Text style={styles.debugText}>
            Distance: {Math.round(distance * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
};

// PropTypes pour la documentation et la validation des props
Joystick.propTypes = {
  size: PropTypes.number,
  innerSize: PropTypes.number,
  outerColor: PropTypes.string,
  innerColor: PropTypes.string,
  onMove: PropTypes.func,
  onRelease: PropTypes.func,
  disabled: PropTypes.bool
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  joystickWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  joystickInner: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65
  },
  debugInfo: {
    position: 'absolute',
    top: -60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
    width: 150
  },
  debugText: {
    color: 'white',
    fontSize: 12
  }
});

export default Joystick;