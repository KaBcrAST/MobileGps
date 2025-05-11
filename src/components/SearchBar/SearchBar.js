import React from 'react';
import { Animated, TouchableOpacity, StyleSheet, Dimensions, View } from 'react-native';
import SearchInput from './SearchInput';
import PredictionsList from './PredictionsList';
import FavoritesMenu from './FavoritesMenu';
import EditFavoriteModal from './EditFavoriteModal';
import useSearchBarLogic from './useSearchBarLogic';


const SearchBar = ({ onPlaceSelect, containerStyle }) => {
  const {
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
      {isSearchFocused && (
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeSearchAndMenu}
        />
      )}

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
              setSearchQuery('');  
              setPredictions([]);  
            } else {
              handleSearch('');
            }
          }}
        />
      </Animated.View>

      {isSearchFocused && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <PredictionsList 
            predictions={predictions}
            onSelectPrediction={handleSelectPlace}
            style={styles.predictions}
          />
        </View>
      )}

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
    zIndex: 1002, 
    elevation: 7,
  },
  predictionsContainer: {
    position: 'absolute',
    top: '13%', 
    left: 20,
    right: 20,
    zIndex: 1003,
    elevation: 8, 
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
    zIndex: 1001,
    elevation: 6,
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
    zIndex: 1000,
    elevation: 5,
  },
});

export default SearchBar;