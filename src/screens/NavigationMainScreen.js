import React, { useRef } from 'react';
import { View } from 'react-native';

// Hooks personnalisés
import useLocation from '../hooks/useLocation';
import useNavigationLogic from '../hooks/useNavigationLogic';
import useMapCamera from '../hooks/useMapCamera';
import useRouteManager from '../hooks/useRouteManager';
import useQRHandler from '../hooks/useQRHandler';
import useNavigationController from '../hooks/useNavigationController';

// Services
import { formatDestination } from '../services/placeService';

// Interface UI
import NavigationUI from '../components/navigation/NavigationUI';
// AJOUT: Importer NavigationSettings
import NavigationSettings from '../components/NavigationSettings';
// AJOUT: Importer useNavigation pour obtenir l'objet navigation
import { useNavigation } from '@react-navigation/native';

/**
 * Écran principal de navigation
 */
export default function NavigationMainScreen() {
  // AJOUT: Obtenir l'objet navigation via le hook
  const navigation = useNavigation();
  
  // Référence à la carte
  const mapRef = useRef(null);
  
  // Hooks de base
  const { location, region, speed } = useLocation(mapRef);
  const navigationLogic = useNavigationLogic(location, mapRef);
  
  // Destructurer les valeurs du hook pour plus de clarté
  const { 
    destination, 
    setDestination, 
    routeInfo, 
    setRouteInfo,
    isNavigating,
    setIsNavigating,
    endNavigation,
    heading,
    avoidTolls,
    handleTollPreferenceChange,
    activeRoute,
    setActiveRoute,
    handleIncomingRouteData // AJOUT: Extraire cette fonction
  } = navigationLogic;
  
  // Hook de gestion de caméra
  const {
    isCameraLocked, 
    unlockCamera, 
    lockCamera,
    fitToCoordinates,
    temporarilyDisableTracking,
    isPreviewMode,
    NORMAL_ALTITUDE,
    forceInitialLowView,
    handleEndNavigation
  } = useMapCamera(mapRef, location, heading, isNavigating, {
    destination,
    coordinates: activeRoute?.coordinates
  });
  
  // Hook de gestion des routes
  const {
    routes,
    setRoutes,
    showRoutes,
    setShowRoutes,
    selectedRoute,
    selectRoute,
    clearRoutes
  } = useRouteManager();
  
  // Hook de contrôle de navigation
  const {
    setupNavigationCamera,
    handleStartNavigation,
    handleEndNavigationComplete
  } = useNavigationController({
    mapRef,
    location,
    heading,
    endNavigation,
    handleEndNavigation,
    NORMAL_ALTITUDE
  });
  
  // Hook de gestion des QR codes
  const {
    qrScannerVisible,
    loading,
    searchQuery,
    setSearchQuery,
    handleQRScanned,
    openQRScanner,
    closeQRScanner,
    setLoading
  } = useQRHandler({
    location,
    avoidTolls,
    setDestination,
    setActiveRoute,
    setRouteInfo,
    setIsNavigating,
    setShowRoutes
  });
  
  // Gestionnaires d'événements
  const onRouteSelect = (route) => {
    selectRoute(route);
    
    // Si le format de route est différent, mettre à jour les routes
    if (route.routes) {
      setRoutes(route.routes);
    }
  };
  
  const onPlaceSelect = async (place) => {
    try {
      const formattedDestination = formatDestination(place);
      setDestination(formattedDestination);
      setShowRoutes(true);
    } catch (error) {
      console.error('Error handling place selection:', error);
    }
  };
  
  const onStartNavigation = (routeData) => {
    try {
      const preparedRoute = handleStartNavigation(routeData);
      
      if (preparedRoute) {
        setActiveRoute(preparedRoute);
        setIsNavigating(true);
        setShowRoutes(false);
      }
    } catch (error) {
      console.warn('Error starting navigation:', error);
    }
  };

  if (!region) return null;

  return (
    <View style={{ flex: 1 }}>
      <NavigationUI
        // État général
        loading={loading}
        isNavigating={isNavigating}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        
        // Props de la carte
        mapRef={mapRef}
        location={location}
        destination={destination}
        heading={heading}
        
        // Props de la navigation
        activeRoute={activeRoute}
        routeInfo={routeInfo}
        speed={speed}
        
        // Props de prévisualisation de route
        showRoutes={showRoutes}
        routes={routes}
        selectedRoute={selectedRoute}
        
        // Gestion de caméra
        isCameraLocked={isCameraLocked}
        unlockCamera={unlockCamera}
        lockCamera={lockCamera}
        isPreviewMode={isPreviewMode}
        fitToCoordinates={fitToCoordinates}
        temporarilyDisableTracking={temporarilyDisableTracking}
        NORMAL_ALTITUDE={NORMAL_ALTITUDE}
        forceInitialLowView={forceInitialLowView}
        
        // Gestionnaires d'événements
        onRouteSelect={onRouteSelect}
        onStartNavigation={onStartNavigation}
        onEndNavigation={handleEndNavigationComplete}
        onPlaceSelect={onPlaceSelect}
        onTollPreferenceChange={handleTollPreferenceChange}
        avoidTolls={avoidTolls}
        setRouteInfo={setRouteInfo}
        
        // États du QR
        qrScannerVisible={qrScannerVisible}
        onQRScanned={handleQRScanned}
        closeQRScanner={closeQRScanner}
        openQRScanner={openQRScanner}
        navigation={navigation}  // Passez l'objet navigation
        onRouteSelected={handleIncomingRouteData}  // Passez la fonction handleIncomingRouteData
      />
      
    </View>
  );
}