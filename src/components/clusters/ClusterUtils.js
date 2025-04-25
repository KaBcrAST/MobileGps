import { StyleSheet } from 'react-native';

const ALERT_CONFIG = {
  POLICE: {
    icon: 'police-badge',
    color: '#2980b9'
  },
  TRAFFIC: {
    icon: 'traffic-cone',
    color: '#e74c3c'
  },
  ACCIDENT: {
    icon: 'car-emergency',
    color: '#c0392b'
  },
  DANGER: {
    icon: 'alert-circle',
    color: '#f39c12'
  }
};

export const getClusterIcon = (type) => {
  return ALERT_CONFIG[type]?.icon || 'alert-circle';
};

export const getAlertIcon = (type) => {
  return ALERT_CONFIG[type]?.icon || 'alert-circle';
};

export const getClusterColor = (type) => {
  return ALERT_CONFIG[type]?.color || '#95a5a6';
};

export const getAlertColor = (type) => {
  return ALERT_CONFIG[type]?.color || '#95a5a6';
};

export const getClusterStyle = (type) => ({
  backgroundColor: 'white',
  borderColor: getClusterColor(type)
});

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