import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Animated, Dimensions, TouchableOpacity, ScrollView, Text, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const API_URL = 'https://react-gpsapi.vercel.app/api/search';
const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;
const STORAGE_KEY = '@favorite_addresses';

const SearchBar = ({ onPlaceSelect, containerStyle }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const animatedPosition = useRef(new Animated.Value(0)).current;
  const bottomMenuPosition = useRef(new Animated.Value(-300)).current;
  const inputRef = useRef(null);
  
  // État pour l'historique des favoris
  const [history, setHistory] = useState([]);
  
  // États pour le modal d'édition
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editAddress, setEditAddress] = useState('');
  const [editTitle, setEditTitle] = useState(''); // Nouveau state pour le titre
  const [editAddressPredictions, setEditAddressPredictions] = useState([]); // Prédictions pour l'adresse en édition
  const [isAddressInputFocused, setIsAddressInputFocused] = useState(false); // Focus sur l'input d'adresse

  // Charger les favoris depuis AsyncStorage au démarrage
  useEffect(() => {
    loadFavorites();
    bottomMenuPosition.setValue(-300);
  }, []);

  // Fonction pour charger les favoris depuis AsyncStorage
  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (savedFavorites) {
        setHistory(JSON.parse(savedFavorites));
      } else {
        // Valeurs par défaut si aucune donnée n'existe
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

  // Fonction pour sauvegarder les favoris dans AsyncStorage
  const saveFavorites = async (updatedFavorites) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  };

  // Modification de la fonction toggleSearchPosition pour éviter le déplacement de la SearchBar
  const toggleSearchPosition = (focused) => {
    setIsSearchFocused(focused);
    
    if (!focused) {
      // Simplement fermer le menu du bas sans déplacer la SearchBar
      setPredictions([]);
      Animated.timing(bottomMenuPosition, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      // Ne pas animer la position de la SearchBar
      animatedPosition.setValue(0); // Réinitialiser à sa position d'origine
    } else {
      // Simplement ouvrir le menu du bas sans déplacer la SearchBar
      Animated.timing(bottomMenuPosition, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      // Ne pas animer la position de la SearchBar
      animatedPosition.setValue(0); // Maintenir à sa position d'origine
    }
  };

  // Fonction générique pour la recherche de prédictions d'adresses
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

  const handleSearch = async (query) => {
    setSearchQuery(query);
    fetchAddressPredictions(query, setPredictions);
  };

  // Fonction pour rechercher des adresses dans le modal d'édition
  const handleEditAddressSearch = (query) => {
    setEditAddress(query);
    fetchAddressPredictions(query, setEditAddressPredictions);
  };

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

  const handleSelectAddressPrediction = async (prediction) => {
    try {
      setEditAddress(prediction.description);
      setEditAddressPredictions([]);
      setIsAddressInputFocused(false);

      const { data: details } = await axios.get(`${API_URL}/places/${prediction.place_id}`);
      
      if (details?.geometry?.location) {
        // Stocker les coordonnées pour les utiliser lors de la sauvegarde
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

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditTitle(item.name);
    setEditAddress(item.address);
    setEditAddressPredictions([]);
    setIsAddressInputFocused(false);
    setModalVisible(true);
  };

  // Fonction pour ajouter un nouveau favori
  const addNewFavorite = () => {
    setSelectedItem({ id: Date.now(), name: '', address: '', icon: 'place', latitude: 0, longitude: 0 });
    setEditTitle('');
    setEditAddress('');
    setEditAddressPredictions([]);
    setIsAddressInputFocused(false);
    setModalVisible(true);
  };
  
  // Fonction pour sauvegarder les modifications
  const saveAddress = async () => {
    try {
      // Vérifier si les champs obligatoires sont remplis
      if (!editAddress.trim()) {
        alert('Veuillez entrer une adresse.');
        return;
      }
      
      // Préparer l'item mis à jour
      const updatedItem = {
        ...selectedItem,
        name: editTitle.trim() || 'Sans titre', // Utiliser un titre par défaut si vide
        address: editAddress.trim(),
      };
      
      // Vérifier si c'est un ajout ou une modification
      const isNewItem = !history.some(item => item.id === selectedItem.id);
      let updatedHistory;
      
      if (isNewItem) {
        updatedHistory = [...history, updatedItem];
      } else {
        updatedHistory = history.map(item => 
          item.id === selectedItem.id ? updatedItem : item
        );
      }
      
      // Mettre à jour l'état local
      setHistory(updatedHistory);
      
      // Sauvegarder dans AsyncStorage
      await saveFavorites(updatedHistory);
      
      // Fermer le modal
      setModalVisible(false);
      
      // Afficher une confirmation (optionnel)
      console.log('Favori sauvegardé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du favori:', error);
    }
  };

  const handleLayoutChange = () => {
    if (inputRef.current && isSearchFocused) {
      inputRef.current.focus();
    }
  };

  // Fonction pour fermer manuellement
  const closeSearchAndMenu = () => {
    toggleSearchPosition(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  return (
    <>
      <Animated.View 
        style={[
          styles.searchContainer,
          containerStyle, // Appliquer les styles personnalisés
          { transform: [{ translateY: animatedPosition }] } // Gardez ceci, mais animatedPosition reste à 0
        ]}
        onLayout={handleLayoutChange}
      >
        {/* Barre de recherche principale */}
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Rechercher une destination..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => toggleSearchPosition(true)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setPredictions([]);
              }}
              style={styles.clearButton}
            >
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Résultats de recherche - autocomplétion */}
        {predictions.length > 0 && (
          <ScrollView style={styles.predictionsContainer}>
            {predictions.map((prediction) => (
              <TouchableOpacity
                key={prediction.place_id}
                style={styles.predictionItem}
                onPress={() => handleSelectPlace(prediction)}
              >
                <Icon name="place" size={20} color="#666" style={styles.placeIcon} />
                <Text style={styles.predictionText}>{prediction.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* Menu du bas avec adresses favorites */}
      {isSearchFocused && (
        <Animated.View 
          style={[
            styles.bottomMenu,
            { transform: [{ translateY: bottomMenuPosition }] }
          ]}
        >
          <View style={styles.bottomMenuHeader}>
            <View style={styles.bottomMenuHandle}>
              <View style={styles.handleBar}></View>
            </View>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeSearchAndMenu}
            >
              <Icon name="close" size={24} color="#999" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.menuTitle}>Destinations favorites</Text>
          
          <ScrollView style={styles.menuScrollView}>
            {history.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => handleSelectHistoryItem(item)}
              >
                <View style={styles.iconContainer}>
                  <Icon name={item.icon} size={24} color="#3498db" />
                </View>
                <View style={styles.historyTextContainer}>
                  <Text style={styles.historyName}>{item.name}</Text>
                  <Text style={styles.historyAddress}>{item.address}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => openEditModal(item)}
                  style={styles.editButton}
                >
                  <Icon name="edit" size={20} color="#aaa" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            
            {/* Bouton pour ajouter un nouveau favori */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={addNewFavorite}
            >
              <Icon name="add" size={24} color="#3498db" />
              <Text style={styles.actionButtonText}>Ajouter un favori</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}

      {/* Backdrop semi-transparent */}
      {isSearchFocused && (
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeSearchAndMenu}
        />
      )}

      {/* Modal pour éditer l'adresse avec autocomplétion et titre personnalisé */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedItem?.name ? `Modifier ${selectedItem.name}` : 'Ajouter un favori'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {/* Champ pour le titre du favori */}
              <Text style={styles.modalLabel}>Nom du favori:</Text>
              <TextInput
                style={styles.modalInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Ex: Domicile, Travail, Café favori..."
                placeholderTextColor="#999"
                autoCapitalize="sentences"
              />
              
              {/* Champ pour l'adresse avec autocomplétion */}
              <Text style={styles.modalLabel}>Adresse:</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  isAddressInputFocused && styles.modalInputFocused
                ]}
                value={editAddress}
                onChangeText={handleEditAddressSearch}
                placeholder="Entrez l'adresse complète"
                placeholderTextColor="#999"
                onFocus={() => setIsAddressInputFocused(true)}
              />
              
              {/* Résultats d'autocomplétion pour l'adresse */}
              {isAddressInputFocused && editAddressPredictions.length > 0 && (
                <ScrollView style={styles.modalPredictionsContainer}>
                  {editAddressPredictions.map((prediction) => (
                    <TouchableOpacity
                      key={prediction.place_id}
                      style={styles.modalPredictionItem}
                      onPress={() => handleSelectAddressPrediction(prediction)}
                    >
                      <Icon name="place" size={18} color="#666" style={styles.modalPlaceIcon} />
                      <Text style={styles.modalPredictionText}>{prediction.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={saveAddress}
                >
                  <Text style={[styles.modalButtonText, {color: 'white'}]}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = {
  // Styles existants...
  searchContainer: {
    position: 'absolute',
    top: '8%',
    left: 20,
    right: 20,
    zIndex: 1001,
    backgroundColor: 'transparent',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  predictionsContainer: {
    backgroundColor: 'white',
    maxHeight: 200,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeIcon: {
    marginRight: 10,
  },
  predictionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 330,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 1001,
    maxHeight: '45%',
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  menuScrollView: {
    maxHeight: '100%',
  },
  bottomMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  bottomMenuHandle: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
  },
  closeButton: {
    padding: 5,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 5,
    color: '#333',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historyAddress: {
    fontSize: 14,
    color: '#777',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#3498db',
  },
  
  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  modalInputFocused: {
    borderColor: '#3498db',
    borderWidth: 2,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: '#f1f1f1',
  },
  modalSaveButton: {
    backgroundColor: '#3498db',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    padding: 10,
  },
  
  // Nouveaux styles pour l'autocomplétion dans le modal
  modalPredictionsContainer: {
    backgroundColor: 'white',
    maxHeight: 150,
    marginTop: -10,
    marginBottom: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  modalPredictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalPlaceIcon: {
    marginRight: 8,
  },
  modalPredictionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
};

export default SearchBar;