import { StyleSheet, Dimensions } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  
  // Correction pour afficher la barre de recherche au-dessus de la carte
  searchWrapper: { 
    position: 'absolute', 
    top: 40, 
    left: '5%', 
    width: '90%', 
    zIndex: 10 
  },
  
  searchContainer: { 
    backgroundColor: 'white', 
    borderRadius: 8, 
    elevation: 5 
  },
  searchInput: { height: 44, fontSize: 16 },

  // Bouton de navigation corrigé
  navButton: { 
    position: 'absolute', 
    bottom: 100, 
    left: '50%', 
    transform: [{ translateX: -75 }], 
    backgroundColor: '#3498db', 
    padding: 12, 
    borderRadius: 8, 
    zIndex: 10 
  },
  navButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // Info sur la distance et le temps
  infoContainer: { 
    position: 'absolute', 
    bottom: 30, 
    alignSelf: 'center', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10, 
    elevation: 5 
  },
  infoText: { fontSize: 16, textAlign: 'center', color: '#333' },

  arrowContainer: {
    width: 60, // Increased from 50
    height: 60, // Increased from 50
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 18, // Increased from 15
    borderRightWidth: 18, // Increased from 15
    borderBottomWidth: 36, // Increased from 30
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3498db',
    transform: [{ rotate: '0deg' }], // Reset rotation to let Marker handle it
  },
  directionsContainer: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 15,
    borderRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  directionsText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
  },
  routeButtons: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  routeButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedRoute: {
    backgroundColor: '#3498db',
  },
  routeButtonText: {
    textAlign: 'center',
    color: '#333',
    fontSize: 14,
  },
  routeSelector: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  routeOption: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedRouteOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
    borderWidth: 2,
  },
  routeOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routePreviewPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
  },
  routePreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  routePreviewItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedRoutePreview: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
    borderWidth: 2,
  },
  routePreviewContent: {
    flex: 1,
  },
  routePreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  routePreviewTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  routePreviewDistance: {
    fontSize: 16,
    color: '#666',
  },
  routePreviewDetails: {
    fontSize: 14,
    color: '#666',
  },
  startNavButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  startNavButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  viewRoutesButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  viewRoutesButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  routeSelectionModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: '100%',
    zIndex: 999,
  },
  routeSelectionContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    zIndex: 1000,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  routeOption: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedRoute: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
    borderWidth: 2,
  },
  routeMainInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  routeVia: {
    fontSize: 14,
    color: '#666',
  },
  routeInfo: {
    flexDirection: 'column',
  },
  routeTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  routeDistance: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  routeVia: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  }
});
