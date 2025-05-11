import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FavoritesMenu = ({ 
  history, 
  onSelectHistoryItem, 
  onEditItem, 
  onAddNewFavorite, 
  onClose 
}) => {
  return (
    <View>
      <View style={styles.bottomMenuHeader}>
        <View style={styles.bottomMenuHandle}>
          <View style={styles.handleBar}></View>
        </View>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Icon name="close" size={24} color="#999" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.menuTitle}>Destinations favorites</Text>
      
      <ScrollView style={styles.menuScrollView}>
        {history.map(item => (
          <FavoriteItem 
            key={item.id} 
            item={item} 
            onSelect={onSelectHistoryItem} 
            onEdit={onEditItem} 
          />
        ))}
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onAddNewFavorite}
        >
          <Icon name="add" size={24} color="rgb(74, 58, 255)" />
          <Text style={styles.actionButtonText}>Ajouter un favori</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Sous-composant pour chaque favori
const FavoriteItem = ({ item, onSelect, onEdit }) => (
  <TouchableOpacity
    style={styles.historyItem}
    onPress={() => onSelect(item)}
  >
    <View style={styles.iconContainer}>
      <Icon name={item.icon} size={24} color="rgb(74, 58, 255)" />
    </View>
    <View style={styles.historyTextContainer}>
      <Text style={styles.historyName}>{item.name}</Text>
      <Text style={styles.historyAddress}>{item.address}</Text>
    </View>
    <TouchableOpacity 
      onPress={() => onEdit(item)}
      style={styles.editButton}
    >
      <Icon name="edit" size={20} color="#aaa" />
    </TouchableOpacity>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
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
  menuScrollView: {
    maxHeight: '100%',
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
    color: 'rgb(74, 58, 255)',
  },
  editButton: {
    padding: 10,
  },
});

export default FavoritesMenu;