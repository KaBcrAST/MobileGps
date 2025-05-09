import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Modal, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API_URL } from '../config/config';
import { setupTrackService, loadSound, playSound } from '../services/trackService';

const { width } = Dimensions.get('window');

const ReportMenu = ({ location }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  
  const [notification, setNotification] = useState(null);
  const notificationAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setupTrackService();
        
        const success = await loadSound(
          'achievement', 
          require('../../assets/sounds/achievement.mp3'), 
          'Alert Sound'
        );
        
        if (success) {
          setSoundReady(true);
        }
      } catch (e) {
        console.error('Erreur lors de l\'initialisation audio:', e);
      }
    };
    
    setupAudio();
  }, []);

  useEffect(() => {
    if (notification) {
      Animated.timing(notificationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(notificationAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setNotification(null);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, notificationAnim]);

  const playAlertSound = async () => {
    if (soundReady) {
      try {
        await playSound('achievement', 1.0);
      } catch (e) {
        console.error('Erreur lors de la lecture du son:', e);
      }
    } 
  };

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  const showNotification = (title, message, type = 'success') => {
    setNotification({
      title,
      message,
      type,
    });
  };

  const sendReport = async (type, label) => {
    if (!location?.coords) {
      showNotification('Erreur', 'Position non disponible', 'error');
      return;
    }

    try {
      playAlertSound();
      await axios.post(`${API_URL}/api/reports`, {
        type,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }, {
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      showNotification('Succès', `Alerte "${label.toLowerCase()}" signalée`);
    } catch (error) {
      console.error('Report error:', error);
      showNotification('Erreur', 'Le signalement a échoué', 'error');
    }

    toggleMenu(); 
  };

  const buttons = [
    { 
      icon: 'car-emergency',
      color: '#e74c3c', 
      label: 'Accidents', 
      type: 'ACCIDENT'
    },
    { 
      icon: 'car-multiple',
      color: '#f39c12', 
      label: 'Embouteillages', 
      type: 'TRAFFIC_JAM'
    },
    { 
      icon: 'road-closed',
      color: '#8e44ad', 
      label: 'Routes fermées', 
      type: 'ROAD_CLOSED'
    },
    { 
      icon: 'police-badge',
      color: '#2980b9', 
      label: 'Contrôles policiers', 
      type: 'POLICE'
    },
    { 
      icon: 'traffic-cone',
      color: '#e67e22', 
      label: 'Obstacles', 
      type: 'OBSTACLE'
    }
  ];

  return (
    <>
      {notification && (
        <Animated.View 
          style={[
            styles.notification, 
            { 
              transform: [{ translateX: notificationAnim }],
              backgroundColor: notification.type === 'error' ? '#e74c3c' : '#2ecc71'
            }
          ]}
        >
          <View style={styles.notificationContent}>
            <Icon 
              name={notification.type === 'error' ? 'alert-circle' : 'check-circle'} 
              size={24} 
              color="#fff" 
            />
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View 
        style={[
          styles.reportPanel,
          {
            transform: [
              { translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0],
                })
              },
            ],
            opacity: animation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.8, 1],
            })
          }
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <Text style={styles.panelTitle}>Signaler un incident</Text>
        <View style={styles.buttonsContainer}>
          {buttons.map((button) => (
            <TouchableOpacity
              key={button.type}
              style={styles.alertButton}
              onPress={() => sendReport(button.type, button.label)} 
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={`Signaler ${button.label}`}
              accessibilityHint={`Signale un incident de type ${button.label} à votre position actuelle`}
            >
              <View style={[styles.iconContainer, { backgroundColor: button.color }]}>
                <Icon name={button.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.buttonLabel}>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Signaler une alerte"
          accessibilityHint="Ouvre le menu pour signaler un incident sur la route"
        >
          <Animated.View
            style={{
              transform: [{
                rotate: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              }],
            }}
          >
            <Icon name="plus" size={30} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 30,
    bottom: 200,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  menuButton: {
    backgroundColor: '#3498db',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  reportPanel: {
    position: 'absolute',
    right: 20,
    bottom: 280,
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 999,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  alertButton: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
  notification: {
    position: 'absolute',
    right: 30,
    bottom: 280,
    width: 220,
    padding: 15,
    zIndex: 9999,
    elevation: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    marginLeft: 10,
    flex: 1,
  },
  notificationTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notificationMessage: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  }
});

export default ReportMenu;