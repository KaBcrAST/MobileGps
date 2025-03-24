import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles/globalStyles';

const RouteSelection = ({ routes, selectedRoute, onRouteSelect, onStartNavigation }) => (
  <View style={styles.routeSelectionContainer}>
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.routesScrollContent}
    >
      {routes.map((route, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.routeCard,
            selectedRoute === index && styles.selectedRouteCard
          ]}
          onPress={() => onRouteSelect(index)}
        >
          <View style={styles.routeCardContent}>
            <View style={styles.routeMainInfo}>
              <Text style={styles.routeTime}>
                {Math.round(route.legs[0].duration.value / 60)} min
              </Text>
              <Text style={styles.routeDistance}>
                {(route.legs[0].distance.value / 1000).toFixed(1)} km
              </Text>
            </View>
            <Text style={styles.routeVia}>
              Via {route.summary || 'Route principale'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
    <TouchableOpacity 
      style={styles.startButton}
      onPress={onStartNavigation}
    >
      <Text style={styles.startButtonText}>GO</Text>
    </TouchableOpacity>
  </View>
);

export default RouteSelection;