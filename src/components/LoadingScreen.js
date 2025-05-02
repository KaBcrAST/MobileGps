import React from 'react';import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';const LoadingScreen = ({ message = "Chargement..." }) => {  return (    <View style={styles.container}>      <View style={styles.loadingContainer}>        <ActivityIndicator size="large" color="#3498db" />        <Text style={styles.loadingText}>{message}</Text>      </View>    </View>  );};const styles = StyleSheet.create({  container: {    position: 'absolute',    top: 0,    left: 0,    right: 0,    bottom: 0,    justifyContent: 'center',    alignItems: 'center',    backgroundColor: 'rgba(255, 255, 255, 0.7)',    zIndex: 1000,  },  loadingContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  }
});

export default LoadingScreen;