import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const EditFavoriteModal = ({
  visible,
  selectedItem,
  editTitle,
  editAddress,
  onTitleChange,
  onAddressChange,
  onAddressInputFocus,
  isAddressInputFocused,
  editAddressPredictions,
  onSelectPrediction,
  onCancel,
  onSave
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ModalHeader 
            title={selectedItem?.name ? `Modifier ${selectedItem.name}` : 'Ajouter un favori'} 
            onClose={onCancel} 
          />
          
          <View style={styles.modalBody}>
            <Text style={styles.modalLabel}>Nom du favori:</Text>
            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={onTitleChange}
              placeholder="Ex: Domicile, Travail, Café favori..."
              placeholderTextColor="#999"
              autoCapitalize="sentences"
            />
            
            <Text style={styles.modalLabel}>Adresse:</Text>
            <TextInput
              style={[
                styles.modalInput,
                isAddressInputFocused && styles.modalInputFocused
              ]}
              value={editAddress}
              onChangeText={onAddressChange}
              placeholder="Entrez l'adresse complète"
              placeholderTextColor="#999"
              onFocus={onAddressInputFocus}
            />
            
            {isAddressInputFocused && editAddressPredictions.length > 0 && (
              <AddressPredictions 
                predictions={editAddressPredictions} 
                onSelect={onSelectPrediction} 
              />
            )}
            
            <ModalButtons onCancel={onCancel} onSave={onSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ModalHeader = ({ title, onClose }) => (
  <View style={styles.modalHeader}>
    <Text style={styles.modalTitle}>{title}</Text>
    <TouchableOpacity onPress={onClose}>
      <Icon name="close" size={24} color="#999" />
    </TouchableOpacity>
  </View>
);

const AddressPredictions = ({ predictions, onSelect }) => (
  <ScrollView style={styles.modalPredictionsContainer}>
    {predictions.map((prediction) => (
      <TouchableOpacity
        key={prediction.place_id}
        style={styles.modalPredictionItem}
        onPress={() => onSelect(prediction)}
      >
        <Icon name="place" size={18} color="#666" style={styles.modalPlaceIcon} />
        <Text style={styles.modalPredictionText}>{prediction.description}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const ModalButtons = ({ onCancel, onSave }) => (
  <View style={styles.modalButtonContainer}>
    <TouchableOpacity 
      style={[styles.modalButton, styles.modalCancelButton]}
      onPress={onCancel}
    >
      <Text style={styles.modalButtonText}>Annuler</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.modalButton, styles.modalSaveButton]}
      onPress={onSave}
    >
      <Text style={[styles.modalButtonText, {color: 'white'}]}>Enregistrer</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
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
});

export default EditFavoriteModal;