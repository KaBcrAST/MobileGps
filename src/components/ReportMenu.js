import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Alert, Modal, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api';

const ReportMenu = ({ location }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;

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

  const sendReport = async (type) => {
    if (!location?.coords) {
      Alert.alert('Erreur', 'Position non disponible');
      return;
    }

    try {
      await axios.post(`${API_URL}/reports`, {
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

      Alert.alert('Succès', 'Alerte signalée avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Le signalement a échoué');
    }

    toggleMenu();
  };

  const confirmReport = async () => {
    if (currentReport) {
      await sendReport(currentReport.type);
      setShowConfirmation(false);
      setCurrentReport(null);
    }
  };

  const buttons = [
    { 
      icon: 'traffic-cone',
      color: '#e74c3c', 
      label: 'Traffic', 
      type: 'TRAFFIC',
      angle: 135
    },
    { 
      icon: 'car-emergency',
      color: '#c0392b', 
      label: 'Accident', 
      type: 'ACCIDENT',
      angle: -135
    },
    { 
      icon: 'police-badge',
      color: '#2980b9', 
      label: 'Police', 
      type: 'POLICE',
      angle: -180
    },
    { 
      icon: 'alert-circle',
      color: '#f39c12', 
      label: 'Danger', 
      type: 'DANGER',
      angle: 180
    }
  ];

  const radius = 80; // Reduced radius for tighter spread

  return (
    <View style={styles.container}>
      {buttons.map((button) => {
        const angleRad = (button.angle * Math.PI) / 180;
        return (
          <Animated.View
            key={button.label}
            style={[
              styles.menuItem,
              {
                transform: [
                  {
                    translateX: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, radius * Math.cos(angleRad)],
                    }),
                  },
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, radius * Math.sin(angleRad)],
                    }),
                  },
                ],
                opacity: animation
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.button, { backgroundColor: button.color }]}
              onPress={() => sendReport(button.type)}
              activeOpacity={0.8}
            >
              <Icon name={button.icon} size={24} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <TouchableOpacity
        style={styles.menuButton}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View
          style={{
            transform: [{
              rotate: animation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '135deg'],
              }),
            }],
          }}
        >
          <Icon name="plus" size={30} color="#fff" />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmation}
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon 
              name={buttons.find(b => b.type === currentReport?.type)?.icon || 'alert'} 
              size={40} 
              color={buttons.find(b => b.type === currentReport?.type)?.color || '#e74c3c'} 
            />
            <Text style={styles.modalTitle}>Confirmer le signalement</Text>
            <Text style={styles.modalText}>
              Voulez-vous signaler un {currentReport?.type?.toLowerCase()} à cet endroit ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmReport}
              >
                <Text style={styles.buttonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 30,
    bottom: 200, // Changed from 140 to move it higher
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
    zIndex: 1,
  },
  menuItem: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center'
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#95a5a6'
  },
  confirmButton: {
    backgroundColor: '#2ecc71'
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default ReportMenu;