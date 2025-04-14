import { StyleSheet } from 'react-native';

export const getClusterIcon = (type) => {
  switch (type) {
    case 'POLICE': 
      return 'police-badge';
    case 'TRAFFIC':
      return 'traffic-cone';
    case 'ACCIDENT':
      return 'car-emergency';
    case 'DANGER':
      return 'alert-circle';
    default:
      return 'alert-circle';
  }
};

export const getClusterColor = (type) => {
  switch (type) {
    case 'POLICE': return '#2980b9';
    case 'TRAFFIC': return '#e74c3c';
    case 'ACCIDENT': return '#c0392b';
    case 'DANGER': return '#f39c12';
    default: return '#95a5a6';
  }
};

export const getClusterStyle = (type) => ({
  backgroundColor: 'white',
  borderColor: getClusterColor(type)
});

export const getAlertIcon = (type) => {
  switch (type) {
    case 'TRAFFIC': return 'traffic-cone';
    case 'ACCIDENT': return 'car-emergency';
    case 'POLICE': return 'police-badge';
    case 'DANGER': return 'alert-circle';
    default: return 'alert-circle';
  }
};

export const getAlertColor = (type) => {
  switch (type) {
    case 'TRAFFIC': return '#e74c3c';
    case 'ACCIDENT': return '#c0392b';
    case 'POLICE': return '#2980b9';
    case 'DANGER': return '#f39c12';
    default: return '#95a5a6';
  }
};

export const styles = StyleSheet.create({
  clusterMarker: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'white',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    zIndex: 900,
  },
  clusterCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
    zIndex: 901,
    elevation: 6,
  },
  clusterCountText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  }
});