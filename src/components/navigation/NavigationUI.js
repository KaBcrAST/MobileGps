import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapDisplay from '../MapDisplay';
import NavigationView from './NavigationView';
import SearchBar from '../SearchBar/SearchBar';
import BlockInfo from '../BlockInfo';
import QRScanner from '../QRScanner';
import RoutePreview from '../RoutePreview/RoutePreview';
import FloatingMenu from '../FloatingMenu';
import ReportMenu from '../ReportMenu';
import globalStyles from '../../styles/globalStyles';

/**
 * Composant d'interface utilisateur de navigation principal
 */
const NavigationUI = ({
  // État général
  loading,
  isNavigating,
  searchQuery,
  setSearchQuery,
  
  // Props de la carte
  mapRef,
  location,
  destination,
  heading,
  
  // Props de la navigation
  activeRoute,
  routeInfo,
  speed,
  
  // Props de prévisualisation de route
  showRoutes,
  routes,
  selectedRoute,
  
  // Gestion de caméra
  isCameraLocked,
  unlockCamera,
  lockCamera,
  isPreviewMode,
  fitToCoordinates,
  temporarilyDisableTracking,
  NORMAL_ALTITUDE,
  forceInitialLowView,
  
  // Gestionnaires d'événements
  onRouteSelect,
  onStartNavigation,
  onEndNavigation,
  onPlaceSelect,
  onTollPreferenceChange,
  avoidTolls,
  setRouteInfo,
  
  // États du QR
  qrScannerVisible,
  onQRScanned,
  closeQRScanner,
  openQRScanner,
  
  // Ajoutez navigation et onRouteSelected aux props
  navigation,  // Ajoutez cette prop
  onRouteSelected  // Ajoutez cette prop
}) => {
  // Propriétés communes pour le composant MapDisplay
  const mapComponentProps = {
    setRouteInfo,
    showRoutes,
    routes,
    selectedRoute,
    onRouteSelect,
    isPreviewMode,
    fitToCoordinates,
    NORMAL_ALTITUDE,
    forceInitialLowView
  };

  if (loading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Préparation de l'itinéraire...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isNavigating ? (
        <NavigationView
          mapRef={mapRef}
          location={location}
          destination={destination}
          heading={heading}
          activeRoute={activeRoute}
          isCameraLocked={isCameraLocked}
          speed={speed}
          routeInfo={routeInfo}
          onEndNavigation={onEndNavigation}
          mapComponentProps={mapComponentProps}
        />
      ) : (
        <>
          <MapDisplay
            mapRef={mapRef}
            location={location}
            destination={destination}
            heading={heading}
            isNavigating={isNavigating}
            activeRoute={activeRoute}
            setRouteInfo={setRouteInfo}
            showRoutes={showRoutes}
            routes={routes}
            selectedRoute={selectedRoute}
            onRouteSelect={onRouteSelect}
            isPreviewMode={isPreviewMode}
            fitToCoordinates={fitToCoordinates}
            NORMAL_ALTITUDE={NORMAL_ALTITUDE}
            forceInitialLowView={forceInitialLowView}
          />
          
          <QRScanner 
            visible={qrScannerVisible}
            onClose={closeQRScanner}
            onQRScanned={onQRScanned}
            setSearchQuery={setSearchQuery}
          />
          
          {showRoutes && (
            <RoutePreview
              origin={location?.coords}
              destination={destination}
              onRouteSelect={onRouteSelect}
              onStartNavigation={onStartNavigation}
              avoidTolls={avoidTolls}
              mapRef={mapRef}
              fitToCoordinates={fitToCoordinates}
              temporarilyDisableTracking={temporarilyDisableTracking}
            />
          )}
          
          <SearchBar 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            onClear={() => setSearchQuery('')}
            onPlaceSelect={onPlaceSelect} 
          />
          
          <BlockInfo 
            speed={speed}
            isNavigating={false}
            routeInfo={routeInfo}
          />
        </>
      )}
      
      <FloatingMenu 
        style={styles.floatingMenuStyle}
        onTollPreferenceChange={onTollPreferenceChange}
        avoidTolls={avoidTolls}
        onCameraLockToggle={isCameraLocked ? unlockCamera : lockCamera}
        isCameraLocked={isCameraLocked}
        onOpenQRScanner={openQRScanner}
        navigation={navigation}  // Transmettez l'objet navigation
        onRouteSelected={onRouteSelected}  // Transmettez la fonction onRouteSelected
      />
      
      <ReportMenu location={location} />
    </View>
  );
};

const styles = StyleSheet.create({
  ...globalStyles,
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333'
  },
  floatingMenuStyle: {
    position: 'absolute',
    top: '8%',
    right: 20,
    zIndex: 1000,
  }
});

export default NavigationUI;