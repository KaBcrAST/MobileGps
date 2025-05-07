import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text } from 'react-native';

const ImagePreview = ({ imageUri, isProcessing }) => {
  return (
    <View style={styles.imageContainer}>
      <Image source={{ uri: imageUri }} style={styles.selectedImage} />
      
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.processingText}>Analyse du QR code...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ImagePreview;