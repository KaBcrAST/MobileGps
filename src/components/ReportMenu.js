import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Modal, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API_URL } from '../config/config';
// Importer les fonctions audio
import { setupTrackService, loadSound, playSound } from '../services/trackService';

// Obtenir les dimensions de l'écran pour le positionnement
const { width } = Dimensions.get('window');

const ReportMenu = ({ location }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [soundReady, setSoundReady] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  
  // États pour la notification
  const [notification, setNotification] = useState(null);
  const notificationAnim = useRef(new Animated.Value(100)).current;

  // Initialiser le système audio au montage du composant
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Initialiser le service audio
        await setupTrackService();
        
        // Charger le son pour l'alerte
        const success = await loadSound(
          'achievement', 
          require('../../assets/sounds/achievement.mp3'), 
          'Alert Sound'
        );
        
        if (success) {
          console.log('Son d\'alerte chargé avec succès');
          setSoundReady(true);
        }
      } catch (e) {
        console.error('Erreur lors de l\'initialisation audio:', e);
      }
    };
    
    setupAudio();
  }, []);

  // Animation de la notification
  useEffect(() => {
    if (notification) {
      // Animation d'entrée (de droite à gauche)
      Animated.timing(notificationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Masquer la notification après un délai
      const timer = setTimeout(() => {
        Animated.timing(notificationAnim, {
          toValue: 100, // Retour vers la droite
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setNotification(null);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, notificationAnim]);

  // Fonction pour jouer le son d'alerte
  const playAlertSound = async () => {
    if (soundReady) {
      try {
        console.log('Lecture du son d\'alerte...');
        await playSound('achievement', 1.0);
      } catch (e) {
        console.error('Erreur lors de la lecture du son:', e);
      }
    } else {
      console.log('Son non prêt, impossible de jouer');
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

  // Afficher une notification
  const showNotification = (title, message, type = 'success') => {
    setNotification({
      title,
      message,
      type,
    });
  };

  const sendReport = async (type) => {
    if (!location?.coords) {
      showNotification('Erreur', 'Position non disponible', 'error');
      return;
    }

    try {
      // Jouer le son immédiatement quand l'utilisateur clique sur un bouton d'alerte
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

      // Afficher la notification de succès
      showNotification('Succès', `Alerte "${type.toLowerCase()}" signalée`);
    } catch (error) {
      console.error('Report error:', error);
      showNotification('Erreur', 'Le signalement a échoué', 'error');
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

  // Montrer la confirmation avec effet sonore
  const showReportConfirmation = (reportType) => {
    // Jouer le son lors de l'ouverture de la confirmation
    playAlertSound();
    
    setCurrentReport({ type: reportType });
    setShowConfirmation(true);
  };

  // Définition des 5 boutons d'alerte demandés
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
      {/* Notification repositionnée à droite au-dessus du bouton */}
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

      {/* Menu principal des alertes */}
      <Animated.View 
        style={[
          styles.reportPanel,
          {
            transform: [
              { translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0], // Glisse depuis le bas
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
              onPress={() => showReportConfirmation(button.type)}
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

      {/* Bouton principal pour ouvrir/fermer le menu */}
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

      {/* Modal de confirmation */}
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
              Voulez-vous signaler "{buttons.find(b => b.type === currentReport?.type)?.label || 'un incident'}" à cet endroit ?
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
    </>
  );
};

// Les styles mis à jour pour le nouveau menu
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
  // Panel pour les boutons d'alerte
  reportPanel: {
    position: 'absolute',
    right: 20,
    bottom: 280, // Au-dessus du bouton principal
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
  // Notification styles
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
  },
  // Modal styles
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