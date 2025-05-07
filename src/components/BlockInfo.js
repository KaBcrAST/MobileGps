import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { API_URL } from '../config/config';

const BlockInfo = ({ 
  speed, 
  isNavigating, 
  location, 
  destination, 
  selectedRouteIndex = 0, 
  activeRoute, 
  routeInfo,
  onShowDetails // nouvelle prop pour afficher plus de détails
}) => {
  const [routeDetails, setRouteDetails] = useState(null);
  const [trafficInfo, setTrafficInfo] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Récupérer les infos de l'itinéraire
  useEffect(() => {
    const fetchRouteInfo = async () => {
      if (!location?.coords || !destination || !isNavigating) return;

      try {
        const response = await axios.get(`${API_URL}/navigation/info`, {
          params: {
            origin: `${location.coords.latitude},${location.coords.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            routeIndex: selectedRouteIndex
          }
        });
        setRouteDetails(response.data);
        
        // Récupérer les informations de trafic si disponibles
        if (response.data?.traffic) {
          setTrafficInfo(response.data.traffic);
        }
      } catch (error) {
        console.error('Failed to fetch route info:', error);
      }
    };

    fetchRouteInfo();
    // Actualiser toutes les 30 secondes pendant la navigation
    const interval = setInterval(fetchRouteInfo, 30000);
    return () => clearInterval(interval);
  }, [location, destination, isNavigating, selectedRouteIndex]);

  // Utiliser les données actives ou les données récupérées
  const duration = activeRoute?.duration || routeDetails?.duration;
  const distance = activeRoute?.distance || routeDetails?.distance;
  const traffic = activeRoute?.traffic || routeDetails?.traffic || trafficInfo;
  
  // Correction du calcul de l'heure d'arrivée
  const getArrivalTime = useCallback(() => {
    if (!duration) return '--:--';
    
    const now = new Date();
    let durationInMinutes;
    
    if (typeof duration === 'object' && duration.value) {
      // Si la durée est un objet Google Maps API avec une propriété 'value' en secondes
      durationInMinutes = Math.round(duration.value / 60);
    } else if (typeof duration === 'string') {
      // Si la durée est une chaîne comme "10 min"
      const match = duration.match(/(\d+)/);
      durationInMinutes = match ? parseInt(match[0], 10) : 0;
    } else if (typeof duration === 'number') {
      // Si c'est déjà un nombre (en secondes probablement)
      durationInMinutes = Math.round(duration / 60);
    } else {
      return '--:--';
    }
    
    // Calculer l'heure d'arrivée
    const arrivalTime = new Date(now.getTime() + (durationInMinutes * 60 * 1000));
    
    // Formater l'heure au format français
    return arrivalTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, [duration]);

  // Formater les valeurs (distance, durée)
  const formatValue = useCallback((value) => {
    if (!value) return '';
    
    if (typeof value === 'object') {
      if (value.text) return value.text;
      if (value.value) {
        // Convertir secondes en minutes pour la durée
        if (value.value >= 60) return `${Math.round(value.value / 60)} min`;
        return `${value.value} s`;
      }
    }
    
    return value;
  }, []);
  
  // Formater la distance de manière plus lisible
  const formatDistance = useCallback((distanceValue) => {
    if (!distanceValue) return '-- km';
    
    let dist;
    let unit = 'km';
    
    if (typeof distanceValue === 'object' && distanceValue.value) {
      dist = distanceValue.value / 1000; // Convertir mètres en km
    } else if (typeof distanceValue === 'number') {
      dist = distanceValue / 1000;
    } else if (typeof distanceValue === 'string') {
      // Si c'est déjà formaté (comme "5,2 km"), on le renvoie tel quel
      return distanceValue;
    } else {
      return '-- km';
    }
    
    // Afficher en mètres si moins de 1 km
    if (dist < 1) {
      dist = Math.round(dist * 1000);
      unit = 'm';
    } else {
      // Arrondir à 1 décimale pour les km
      dist = Math.round(dist * 10) / 10;
    }
    
    return `${dist} ${unit}`;
  }, []);

  // Afficher les incidents de trafic s'il y en a
  const renderTrafficInfo = () => {
    if (!traffic?.hasSlowdowns) return null;
    
    return (
      <View style={styles.trafficInfoContainer}>
        <Icon name="traffic-light" size={18} color="#FF8800" />
        <Text style={styles.trafficInfoText}>
          +{traffic.slowdownDuration?.text || "0 min"} de ralentissement
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Interface style Waze */}
      {isNavigating ? (
        <View style={styles.wazeContainer}>
          {/* Partie supérieure avec la vitesse et l'heure d'arrivée */}
          <View style={styles.topInfoRow}>
            <View style={styles.speedSection}>
              <View style={styles.speedometer}>
                <Text style={styles.speedValue}>{Math.round(speed) || 0}</Text>
                <Text style={styles.speedUnit}>km/h</Text>
              </View>
            </View>
            
            <View style={styles.mainInfoSection}>
              <View style={styles.arrivalSection}>
                <Text style={styles.arrivalLabel}>Arrivée à</Text>
                <Text style={styles.arrivalTime}>{getArrivalTime()}</Text>
              </View>
              
              <View style={styles.distanceSection}>
                <Text style={styles.distanceValue}>{formatDistance(distance)}</Text>
                <Icon name="map-marker-distance" size={16} color="#666" style={styles.distanceIcon} />
              </View>
            </View>
          </View>
          
          {/* Barre de progression (simulée) */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
          </View>
          
          {/* Information sur le trafic */}
          {renderTrafficInfo()}
          
          {/* Information sur la durée restante */}
          <View style={styles.durationContainer}>
            <Icon name="clock-outline" size={18} color="#666" />
            <Text style={styles.durationText}>
              {formatValue(duration) || '-- min'} restantes
            </Text>
          </View>
        </View>
      ) : (
        // Affichage simplifié quand pas en navigation
        <View style={styles.simplifiedView}>
          <View style={styles.speedometer}>
            <Text style={styles.speedValue}>{Math.round(speed) || 0}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
          
          {routeInfo && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoText}>
                Distance: {formatDistance(routeInfo.distance)}
              </Text>
              <Text style={styles.routeInfoText}>
                Durée: {formatValue(routeInfo.duration)}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Bouton pour développer/réduire */}
      {isNavigating && (
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => onShowDetails && onShowDetails()}
        >
          <Icon 
            name={expanded ? "chevron-down" : "chevron-up"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  wazeContainer: {
    width: '100%',
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  speedSection: {
    width: '25%',
    alignItems: 'center',
  },
  mainInfoSection: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 15,
  },
  speedometer: {
    backgroundColor: '#1A73E8', // Couleur bleue style Waze
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  speedValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  speedUnit: {
    color: '#fff',
    fontSize: 12,
    marginTop: -5,
  },
  arrivalSection: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  arrivalLabel: {
    fontSize: 12,
    color: '#666',
  },
  arrivalTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  distanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
  },
  distanceIcon: {
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginVertical: 10,
    width: '100%',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '30%', // Simulé - à remplacer par un calcul réel
    backgroundColor: '#1A73E8',
    borderRadius: 2,
  },
  trafficInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 8,
  },
  trafficInfoText: {
    color: '#FF8800',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  durationText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  expandButton: {
    alignSelf: 'center',
    paddingVertical: 5,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  simplifiedView: {
    alignItems: 'center',
  },
  routeInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  routeInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});

export default BlockInfo;