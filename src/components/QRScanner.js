import React, { useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { decodeQRCode } from '../services/QRDecoderService';
import { getCurrentLocation } from '../services/GeolocationService';
import { startDirectNavigation } from '../services/navigationService';
import { processQRData } from '../services/QRDataProcessorService';
import QRScannerHeader from './QRScannerUI/Header';
import ScanOptions from './QRScannerUI/ScanOptions';
import ImagePreview from './QRScannerUI/ImagePreview';
import HelpBox from './QRScannerUI/HelpBox';

const QRScanner = ({ onQRScanned, visible, onClose, setSearchQuery }) => {
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const handleImageSelection = async (imageUri) => {
    setImage(imageUri);
    try {
      setProcessing(true);
      const qrData = await decodeQRCode(imageUri);
      if (qrData) {
        await handleQRData(qrData);
      }
    } catch (error) {
      console.error("Erreur de traitement QR:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleQRData = async (data) => {
    try {
      const navigationHandler = async (destination) => {
        try {
          setNavigating(true);
          const currentPosition = await getCurrentLocation();
          
          if (!currentPosition) {
            throw new Error("Position actuelle non disponible");
          }
          
          const route = await startDirectNavigation(
            currentPosition,
            destination,
            false // avoidTolls par défaut
          );
          
          onQRScanned({
            ...destination,
            route: route,
            direct: true,
            mode: destination.mode || "driving"
          });
          
          onClose();
        } catch (error) {
          console.error("Erreur navigation:", error);
          throw error;
        } finally {
          setNavigating(false);
        }
      };

      const searchHandler = (searchTerm) => {
        onQRScanned({ searchTerm, direct: false });
        if (setSearchQuery) {
          setSearchQuery(searchTerm);
        }
        onClose();
      };

      await processQRData(data, navigationHandler, searchHandler);
      
    } catch (error) {
      console.error("Erreur de traitement:", error);
      setProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <QRScannerHeader onClose={onClose} />

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <ScanOptions 
            onTakePicture={handleImageSelection} 
            onPickImage={handleImageSelection} 
            isProcessing={processing} 
          />

          {image && (
            <ImagePreview 
              imageUri={image} 
              isProcessing={processing} 
            />
          )}
          
          <HelpBox />
        </ScrollView>

        {navigating && (
          <View style={styles.navigationOverlay}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.navigationText}>Préparation de l'itinéraire...</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  navigationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  navigationText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default QRScanner;