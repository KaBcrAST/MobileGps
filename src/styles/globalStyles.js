import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 20,
    color: '#000',
  },

  // Search and Menu styles
  searchWrapper: {
    position: 'absolute',
    top: '8%', // Changed from 20 to '10%'
    left: 80, // Make room for menu button
    right: 20,
    zIndex: 999,
  },
  searchInputWrapper: {
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
  },
  searchInput: {
    height: 44,
    fontSize: 16,
    paddingLeft: 10,
  },
  menuButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 5,
  },
  
  // Menu Modal styles
  menuModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },

  // Add to existing styles
  directionsContainer: {
    position: 'absolute',
    left: 20,
    top: '45%',
    zIndex: 999,
  },
  directionBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  distanceText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  arrowContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 36,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3498db',
    transform: [{ rotate: '0deg' }],
  },

  // Add to existing styles
  routeSelectionContainer: {
    position: 'absolute',
    top: 120, // Changed from bottom positioning
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  routesScrollContent: {
    paddingHorizontal: 10,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    elevation: 5,
    width: 200,
    marginBottom: 10,
  },
  selectedRouteCard: {
    borderColor: '#3498db',
    borderWidth: 2,
  },
  routeMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  routeDistance: {
    fontSize: 16,
    color: '#666',
  },
  routeVia: {
    fontSize: 14,
    color: '#666',
  },
  startButton: {
    backgroundColor: '#3498db',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Slide Menu styles
  slideMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  statsBlock: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    minWidth: 200,
    elevation: 5,
    zIndex: 1000
  },

  historyContainer: {
    position: 'absolute',
    top: 80, // Ajustez selon votre layout
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
    zIndex: 1
  },

  historyWrapper: {
    position: 'absolute',
    top: 100, // Ajustez selon votre layout
    left: 10,
    right: 10,
    zIndex: 1,
  },
  
  historyContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export const mapStyles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default styles;