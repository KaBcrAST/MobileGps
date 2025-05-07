import React from 'react';
import { Animated, TouchableOpacity, StyleSheet, Dimensions, View } from 'react-native';
import SearchInput from './SearchInput';
import PredictionsList from './PredictionsList';
import FavoritesMenu from './FavoritesMenu';
import EditFavoriteModal from './EditFavoriteModal';
import useSearchBarLogic from './useSearchBarLogic';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const SearchBar = ({ onPlaceSelect, containerStyle }) => {
  const {
    // États
    isSearchFocused,
    searchQuery,
    predictions,
    setPredictions,
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
    setEditTitle,
    setSearchQuery,
    handleLayoutChange
  } = useSearchBarLogic(onPlaceSelect);

  return (
    <>
      {/* Backdrop semi-transparent - en premier (plus bas niveau z-index) */}
      {isSearchFocused && (
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeSearchAndMenu}
        />
      )}

      {/* Menu des favoris - rendu en second (niveau z-index intermédiaire) */}
      {isSearchFocused && (
        <Animated.View 
          style={[
            styles.favoritesMenuContainer,
            { transform: [{ translateY: bottomMenuPosition }] }
          ]}
        >
          <FavoritesMenu 
            history={history}
            onSelectHistoryItem={handleSelectHistoryItem}
            onEditItem={openEditModal}
            onAddNewFavorite={addNewFavorite}
            onClose={closeSearchAndMenu}
          />
        </Animated.View>
      )}

      {/* Barre de recherche - rendue en troisième (niveau z-index supérieur) */}
      <Animated.View 
        style={[
          styles.searchContainer,
          containerStyle,
          { transform: [{ translateY: animatedPosition }] }
        ]}
        onLayout={handleLayoutChange}
      >
        <SearchInput
          inputRef={inputRef}
          searchQuery={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => toggleSearchPosition(true)}
          onClear={() => {
            if (typeof setSearchQuery === 'function') {
              setSearchQuery('');  // Assurez-vous que setSearchQuery est défini
              setPredictions([]);  // Et setPredictions aussi
            } else {
              console.warn("setSearchQuery n'est pas une fonction");
              // Fallback: essayer d'utiliser handleSearch directement
              handleSearch('');
            }
          }}
        />
      </Animated.View>

      {/* Liste des prédictions - rendue en dernier (niveau z-index le plus élevé) */}
      {isSearchFocused && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <PredictionsList 
            predictions={predictions}
            onSelectPrediction={handleSelectPlace}
            style={styles.predictions}
          />
        </View>
      )}

      {/* Modal d'édition */}
      <EditFavoriteModal
        visible={modalVisible}
        selectedItem={selectedItem}
        editTitle={editTitle}
        editAddress={editAddress}
        onTitleChange={setEditTitle}
        onAddressChange={handleEditAddressSearch}
        onAddressInputFocus={() => setIsAddressInputFocused(true)}
        isAddressInputFocused={isAddressInputFocused}
        editAddressPredictions={editAddressPredictions}
        onSelectPrediction={handleSelectAddressPrediction}
        onCancel={() => setModalVisible(false)}
        onSave={saveAddress}
      />
    </>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    top: '8%',
    left: 20,
    right: 20,
    zIndex: 1002, // Supérieur au menu des favoris
    elevation: 7, // Pour Android
  },
  predictionsContainer: {
    position: 'absolute',
    top: '13%', // Ajusté pour se positionner sous la barre de recherche
    left: 20,
    right: 20,
    zIndex: 1003, // Supérieur à tout le reste
    elevation: 8, // Pour Android
  },
  predictions: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  favoritesMenuContainer: {
    position: 'absolute',
    top: '20%', 
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    zIndex: 1001, // Inférieur aux prédictions mais supérieur au backdrop
    elevation: 6, // Pour Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 10,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000, // Le plus bas
    elevation: 5, // Pour Android
  },
});

export default SearchBar;