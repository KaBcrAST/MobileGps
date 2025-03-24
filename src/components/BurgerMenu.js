import React from 'react';
import { View, Modal, Text, TouchableOpacity } from 'react-native';
import styles from './styles';

const BurgerMenu = ({ visible, onClose }) => {
  const menuItems = [
    { id: 1, title: 'Paramètres', onPress: () => console.log('Settings') },
    { id: 2, title: 'Historique', onPress: () => console.log('History') },
    { id: 3, title: 'Favoris', onPress: () => console.log('Favorites') },
    { id: 4, title: 'Aide', onPress: () => console.log('Help') },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.menuContent}>
          {menuItems.map(item => (
            <TouchableOpacity 
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                item.onPress();
                onClose();
              }}
            >
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={onClose}
          >
            <Text style={styles.menuItemText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default BurgerMenu;