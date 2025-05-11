// FavoritesListComponent.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getCurrentLocation } from '../services/GeolocationService';
import { startDirectNavigation } from '../services/navigationService';

const FavoritesListComponent = ({ onSelectRoute, onClose }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const { user } = useAuth();
  const hasFetchedRef = useRef(false);
  const navigation = useNavigation();
  const refreshIntervalRef = useRef(null);

  // Utiliser useCallback pour la fonction fetchFavorites afin qu'elle soit mémorisée
  const fetchFavorites = useCallback(async (force = false) => {
    if (loading && !force) return;
    if (hasFetchedRef.current && !force && favorites.length > 0) return;

    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('Vous devez être connecté pour voir vos favoris');
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError('Authentification requise');
        return;
      }

      const response = await axios.get(`${API_URL}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          limit: 50
        }
      });

      if (response.data.success) {
        setFavorites(response.data.favorites || []);
        hasFetchedRef.current = true;
      } else {
        throw new Error(response.data.message || 'Erreur lors de la récupération des favoris');
      }

    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
        } else if (err.response.status === 404) {
          setFavorites([]);
          setError(null);
        } else {
          setError(`Erreur serveur (${err.response.status})`);
        }
      } else {
        setError('Erreur réseau ou serveur');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, favorites.length, user]);

  // Fonction pour rafraîchir les données utilisateur avec useCallback
  const refreshUserData = useCallback(async () => {
    try {
      console.log("Rafraîchissement des données utilisateur...");
      await fetchFavorites(true);
      return true;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      return false;
    }
  }, [fetchFavorites]);

  // Configuration du rafraîchissement automatique avec cleanup approprié
  useEffect(() => {
    // Définir la fonction de rafraîchissement au niveau global
    if (typeof window !== 'undefined') {
      window.refreshFavoritesList = refreshUserData;
    }

    // Configuration d'un intervalle pour rafraîchir les données périodiquement
    refreshIntervalRef.current = setInterval(() => {
      refreshUserData().catch(error => {
        console.error("Erreur lors du rafraîchissement automatique:", error);
      });
    }, 60000); // Rafraîchir toutes les minutes

    // Nettoyage lors du démontage du composant
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      if (typeof window !== 'undefined' && window.refreshFavoritesList) {
        window.refreshFavoritesList = undefined;
      }
    };
  }, [refreshUserData]);

  // Chargement initial des favoris
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchFavorites();
    }
  }, [fetchFavorites]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites(true);
  };

  // Fonction pour lancer la navigation depuis un favori sélectionné
  const handleSelectFavorite = async (favorite) => {
    try {
      // Indiquer le début de la navigation
      setNavigating(true);
      
      // Récupérer la position actuelle
      const currentPosition = await getCurrentLocation();
      
      if (!currentPosition) {
        Alert.alert(
          "Erreur de localisation",
          "Impossible d'obtenir votre position actuelle. Vérifiez que la localisation est activée."
        );
        setNavigating(false);
        return;
      }
      
      // Construire la destination en format compatible
      const destination = {
        latitude: parseFloat(favorite.destination.lat || favorite.destination.latitude),
        longitude: parseFloat(favorite.destination.lng || favorite.destination.longitude),
        name: favorite.destination.name || 'Destination',
        address: favorite.destination.address || favorite.destination.name || `Coordonnées GPS: ${favorite.destination.lat}, ${favorite.destination.lng}`
      };
      
      // Vérifier que les coordonnées sont valides
      if (isNaN(destination.latitude) || isNaN(destination.longitude)) {
        throw new Error('Coordonnées de destination invalides');
      }
      
      // Marquer le favori comme utilisé (de façon non bloquante)
      markFavoriteAsUsed(favorite._id).catch(err => 
        console.error("Erreur lors du marquage du favori:", err)
      );
      
      // Obtenir l'itinéraire pour la navigation directe
      const route = await startDirectNavigation(
        {
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude
        },
        destination,
        false // Ne pas éviter les péages
      );
      
      // Préparer les données pour la navigation
      const resultData = {
        ...destination,
        route: route,
        direct: true,
        startNavigation: true,
        navigationMode: true,
        mode: favorite.travelMode?.toLowerCase() || "driving"
      };
      
      console.log('Itinéraire direct reçu avec succès');
      
      // Utiliser l'approche appropriée selon le contexte
      if (onSelectRoute) {
        console.log("Utilisation du callback onSelectRoute");
        onSelectRoute(resultData);
      } 
      else if (navigation) {
        console.log("Navigation vers l'écran Map avec params");
        navigation.navigate('Map', {
          routeData: resultData,
          startNavigation: true,
          showRoutePreview: false
        });
      }
      else {
        throw new Error("Aucune méthode de navigation disponible");
      }
      
      // Fermer le panneau des favoris dans tous les cas
      if (onClose) {
        onClose();
      }
      
    } catch (err) {
      console.error("Erreur lors du démarrage de la navigation:", err);
      Alert.alert(
        "Erreur de navigation", 
        `Impossible de démarrer la navigation: ${err.message}`,
        [{ text: "OK" }]
      );
    } finally {
      // Réinitialiser l'état de navigation
      setTimeout(() => {
        setNavigating(false);
      }, 500);
    }
  };
  
  // Fonction pour marquer un favori comme utilisé
  const markFavoriteAsUsed = async (favoriteId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      await axios.post(`${API_URL}/api/favorites/${favoriteId}/use`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Erreur lors du marquage du favori comme utilisé:', err);
    }
  };

  // Utiliser renderFavoriteItem avec la mise en page d'origine
  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() => handleSelectFavorite(item)}
      disabled={navigating}
    >
      <Ionicons name="star" size={24} color={item.color || '#4A3AFF'} style={styles.favoriteIcon} />
      <View style={styles.favoriteContent}>
        <Text style={styles.favoriteName}>{item.name || 'Trajet favori'}</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={12} color="#666" style={styles.tinyIcon} />
          <Text style={styles.addressText} numberOfLines={1}>
            {(item.origin.name || item.origin.address)} → {(item.destination.name || item.destination.address)}
          </Text>
        </View>
      </View>
      {navigating ? (
        <ActivityIndicator size="small" color="#4A3AFF" />
      ) : (
        <Ionicons name="navigate" size={20} color="#4A3AFF" style={styles.navigateIcon} />
      )}
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.centerContent}>
        <Ionicons name="log-in-outline" size={40} color="#95a5a6" />
        <Text style={styles.emptyText}>Connexion requise</Text>
        <Text style={styles.emptySubtext}>Connectez-vous pour voir vos favoris</Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4A3AFF" />
        <Text style={styles.loadingText}>Chargement des favoris...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={40} color="#FF4A4A" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="star-outline" size={40} color="#95a5a6" />
        <Text style={styles.emptyText}>Aucun favori</Text>
        <Text style={styles.emptySubtext}>Ajoutez vos trajets pour les retrouver ici</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      {navigating && (
        <View style={styles.navigationOverlay}>
          <ActivityIndicator size="large" color="#4A3AFF" />
          <Text style={styles.navigationText}>Préparation de l'itinéraire...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  favoriteItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  favoriteIcon: { 
    marginRight: 12 
  },
  favoriteContent: { 
    flex: 1 
  },
  favoriteName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 4 
  },
  addressRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  tinyIcon: { 
    marginRight: 5 
  },
  addressText: { 
    fontSize: 14, 
    color: '#666', 
    flex: 1 
  },
  navigateIcon: { 
    marginLeft: 10, 
    opacity: 0.7 
  },
  centerContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  loadingText: { 
    marginTop: 10, 
    color: '#666', 
    fontSize: 16 
  },
  errorText: { 
    marginTop: 10, 
    color: '#FF4A4A', 
    fontSize: 16, 
    textAlign: 'center' 
  },
  retryButton: { 
    marginTop: 20, 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    backgroundColor: '#4A3AFF', 
    borderRadius: 5 
  },
  retryText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  emptyText: { 
    marginTop: 10, 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#666' 
  },
  emptySubtext: { 
    marginTop: 5, 
    fontSize: 14, 
    color: '#95a5a6', 
    textAlign: 'center' 
  },
  navigationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  navigationText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A3AFF',
    fontWeight: 'bold'
  }
});

export default FavoritesListComponent;