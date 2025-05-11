import React from 'react';
import { View, StyleSheet } from 'react-native';
import useRouteProgress from '../hooks/useRouteProgress';
import Speedometer from './navigation/Speedometer';
import ProgressBar from './navigation/ProgressBar';
import TrafficInfo from './navigation/TrafficInfo';
import RouteDetails from './navigation/RouteDetails';
import DurationInfo from './navigation/DurationInfo';
import EndButton from './navigation/EndButton';
import SimpleView from './navigation/SimpleView';

const BlockInfo = ({ 
  speed, 
  isNavigating, 
  location, 
  destination, 
  selectedRouteIndex = 0, 
  activeRoute, 
  routeInfo,
  onEndNavigation,
  onNearDestination
}) => {
  const { 
    routeDetails, 
    trafficInfo, 
    progressPercent 
  } = useRouteProgress({
    location,
    destination,
    isNavigating,
    selectedRouteIndex,
    activeRoute,
    onNearDestination
  });

  const duration = activeRoute?.duration || routeDetails?.duration;
  const distance = activeRoute?.distance || routeDetails?.distance;
  const traffic = activeRoute?.traffic || routeDetails?.traffic || trafficInfo;

  return (
    <View style={styles.container}>
      {isNavigating ? (
        <View style={styles.wazeContainer}>
          <View style={styles.topInfoRow}>
            <View style={styles.speedSection}>
              <Speedometer speed={speed} />
            </View>
            
            <RouteDetails duration={duration} distance={distance} />
          </View>
          
          <ProgressBar progressPercent={progressPercent} />
          
          <TrafficInfo traffic={traffic} />
          
          <DurationInfo duration={duration} />
          
          <View style={styles.actionButtonsContainer}>
            <EndButton onPress={onEndNavigation} />
          </View>
        </View>
      ) : (
        <SimpleView speed={speed} routeInfo={routeInfo} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  wazeContainer: {
    width: '100%',
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  speedSection: {
    width: '25%',
    alignItems: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});

export default BlockInfo;