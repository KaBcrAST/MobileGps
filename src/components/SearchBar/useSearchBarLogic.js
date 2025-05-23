import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api/search';
const STORAGE_KEY = '@favorite_addresses';

export default function useSearchBarLogic(onPlaceSelect) {
  // États pour la recherche
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  
  // États pour les animations
  const animatedPosition = useRef(new Animated.Value(0)).current;
  const bottomMenuPosition = useRef(new Animated.Value(-300)).current;
  const inputRef = useRef(null);
  
  // États pour les favoris
  const [history, setHistory] = useState([]);
  
  // États pour le modal d'édition
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editAddress, setEditAddress] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editAddressPredictions, setEditAddressPredictions] = useState([]);
  const [isAddressInputFocused, setIsAddressInputFocused] = useState(false);

  // Charger les favoris au démarrage
  useEffect(() => {
    loadFavorites();
    bottomMenuPosition.setValue(-300);
  }, []);

  // Fonction pour charger les favoris
  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (savedFavorites) {
        setHistory(JSON.parse(savedFavorites));
      } else {
        // Valeurs par défaut
        const defaultFavorites = [
          { id: 1, name: 'Domicile', address: '123 Rue Principale', icon: 'home', latitude: 0, longitude: 0 },
          { id: 2, name: 'Travail', address: '456 Avenue des Affaires', icon: 'work', latitude: 0, longitude: 0 }
        ];
        setHistory(defaultFavorites);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFavorites));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  };

  // Sauvegarder les favoris
  const saveFavorites = async (updatedFavorites) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  };

  // Gérer l'animation de focus/blur
  const toggleSearchPosition = (focused) => {
    setIsSearchFocused(focused);
    
    if (!focused) {
      setPredictions([]);
      Animated.timing(bottomMenuPosition, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true
      }).start();
      animatedPosition.setValue(0);
    } else {
      Animated.timing(bottomMenuPosition, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
      animatedPosition.setValue(0);
    }
  };

  // Fonction pour rechercher des adresses
  const fetchAddressPredictions = async (query, setResults) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    try {
      const { data: predictions } = await axios.get(`${API_URL}/places`, {
        params: { query }
      });
      setResults(predictions);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresses:', error);
      setResults([]);
    }
  };

  // Recherche principale
  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchAddressPredictions(query, setPredictions);
  };

  // Recherche dans le modal d'édition
  const handleEditAddressSearch = (query) => {
    setEditAddress(query);
    fetchAddressPredictions(query, setEditAddressPredictions);
  };

  // Sélection d'un lieu dans la recherche
  const handleSelectPlace = async (prediction) => {
    try {
      setSearchQuery(prediction.description);
      setPredictions([]);
      toggleSearchPosition(false);

      const { data: details } = await axios.get(`${API_URL}/places/${prediction.place_id}`);
      
      if (details?.geometry?.location) {
        const destination = {
          name: details.name || prediction.structured_formatting?.main_text || prediction.description,
          address: details.formatted_address || prediction.description,
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
        };
        onPlaceSelect(destination);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du lieu:', error);
      setSearchQuery('');
      setPredictions([]);
    }
  };

  // Sélection d'une prédiction d'adresse dans le modal
  const handleSelectAddressPrediction = async (prediction) => {
    try {
      setEditAddress(prediction.description);
      setEditAddressPredictions([]);
      setIsAddressInputFocused(false);

      const { data: details } = await axios.get(`${API_URL}/places/${prediction.place_id}`);
      
      if (details?.geometry?.location) {
        setSelectedItem(prev => ({
          ...prev,
          address: details.formatted_address || prediction.description,
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'adresse:', error);
    }
  };

  // Sélection d'un favori
  const handleSelectHistoryItem = (item) => {
    if (!item.latitude || !item.longitude) {
      console.warn("Cet emplacement n'a pas de coordonnées GPS");
      return;
    }
    
    const destination = {
      name: item.name,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    };
    onPlaceSelect(destination);
    toggleSearchPosition(false);
  };

  // Ouvrir le modal d'édition
  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditTitle(item.name);
    setEditAddress(item.address);
    setEditAddressPredictions([]);
    setIsAddressInputFocused(false);
    setModalVisible(true);
  };

  // Ajouter un nouveau favori
  const addNewFavorite = () => {
    setSelectedItem({ id: Date.now(), name: '', address: '', icon: 'place', latitude: 0, longitude: 0 });
    setEditTitle('');
    setEditAddress('');
    setEditAddressPredictions([]);
    setIsAddressInputFocused(false);
    setModalVisible(true);
  };
  
  // Sauvegarder un favori
  const saveAddress = async () => {
    try {
      if (!editAddress.trim()) {
        alert('Veuillez entrer une adresse.');
        return;
      }
      
      const updatedItem = {
        ...selectedItem,
        name: editTitle.trim() || 'Sans titre',
        address: editAddress.trim(),
      };
      
      const isNewItem = !history.some(item => item.id === selectedItem.id);
      let updatedHistory;
      
      if (isNewItem) {
        updatedHistory = [...history, updatedItem];
      } else {
        updatedHistory = history.map(item => 
          item.id === selectedItem.id ? updatedItem : item
        );
      }
      
      setHistory(updatedHistory);
      await saveFavorites(updatedHistory);
      setModalVisible(false);
      
      console.log('Favori sauvegardé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du favori:', error);
    }
  };

  // Handler pour le changement de layout
  const handleLayoutChange = () => {
    if (inputRef.current && isSearchFocused) {
      inputRef.current.focus();
    }
  };

  // Fermer la recherche et le menu
  const closeSearchAndMenu = () => {
    toggleSearchPosition(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  return {
    // États
    isSearchFocused,
    searchQuery,
    predictions,
    animatedPosition,
    bottomMenuPosition,
    inputRef,
    history,
    modalVisible,
    selectedItem,
    editAddress,
    editTitle,
    editAddressPredictions,
    isAddressInputFocused,
    
    // Handlers
    handleSearch,
    handleSelectPlace,
    toggleSearchPosition,
    handleSelectHistoryItem,
    openEditModal,
    addNewFavorite,
    handleEditAddressSearch,
    setIsAddressInputFocused,
    handleSelectAddressPrediction,
    saveAddress,
    closeSearchAndMenu,
    setModalVisible,
    handleLayoutChange
  };
}