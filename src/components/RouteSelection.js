import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles/globalStyles';

const RouteSelection = ({ routes, selectedRoute, onRouteSelect, onStartNavigation }) => {
  const handleRouteSelect = (index) => {
    console.log('🚗 Selecting route:', {
      index,
      summary: routes[index].summary,
      duration: routes[index].duration?.value,
      distance: routes[index].distance?.value
    });
    
    // Force la sélection de la route
    onRouteSelect(index);
  };

  const handleStartNavigation = () => {
    // Vérifie qu'une route est sélectionnée
    if (selectedRoute === null || selectedRoute === undefined) {
      console.warn('❌ No route selected!');
      return;
    }

    console.log('✅ Starting navigation with route:', {
      index: selectedRoute,
      summary: routes[selectedRoute].summary
    });

    // Démarre la navigation avec la route sélectionnée
    onStartNavigation(routes[selectedRoute]);
  };

  return (
    <View style={styles.routeSelectionContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.routesScrollContent}
      >
        {routes.map((route, index) => {
          const isSelected = selectedRoute === index;
          const duration = route.duration || route.legs?.[0]?.duration;
          const distance = route.distance || route.legs?.[0]?.distance;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.routeCard,
                isSelected && styles.selectedRouteCard
              ]}
              onPress={() => handleRouteSelect(index)}
            >
              <View style={styles.routeCardContent}>
                <View style={styles.routeMainInfo}>
                  <Text style={[
                    styles.routeTime,
                    isSelected && styles.selectedRouteText
                  ]}>
                    {Math.round(duration.value / 60)} min
                  </Text>
                  <Text style={[
                    styles.routeDistance,
                    isSelected && styles.selectedRouteText
                  ]}>
                    {(distance.value / 1000).toFixed(1)} km
                  </Text>
                </View>
                <Text style={[
                  styles.routeVia,
                  isSelected && styles.selectedRouteText
                ]}>
                  Via {route.summary || 'Route principale'}
                  {route.hasTolls && ' (Péages)'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity 
        style={styles.startButton}
        onPress={handleStartNavigation}
      >
        <Text style={styles.startButtonText}>GO</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RouteSelection;