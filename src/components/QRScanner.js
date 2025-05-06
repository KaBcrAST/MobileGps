import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Modal, SafeAreaView, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { startDirectNavigation } from '../services/navigationService';
import * as Location from 'expo-location'; // Pour obtenir la position actuelle
import axios from 'axios'; // Importez axios

const QRScanner = ({ onQRScanned, visible, onClose }) => {
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [navigating, setNavigating] = useState(false); // Nouvel état pour le statut de navigation

  // Fonction pour obtenir la position actuelle
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission de localisation refusée');
        return null;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la localisation:', error);
      return null;
    }
  };

  // Fonction de décodage QR code améliorée
  const decodeQRCode = async (imageUri) => {
    try {
      setProcessing(true);
      
      // Redimensionner l'image pour l'envoyer plus facilement
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 600 } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 }
      );
      
      // Convertir l'image en base64
      const base64Image = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log("Préparation de l'envoi de l'image pour décodage...");
      
      // Créer un objet FormData pour envoyer l'image correctement
      const formData = new FormData();
      formData.append('file', {
        uri: manipResult.uri,
        type: 'image/jpeg',
        name: 'qr_image.jpg',
      });
      
      // Utiliser l'API pour décoder le QR code - MÉTHODE 1 avec fetch et FormData
      console.log("Envoi de l'image pour décodage via FormData...");
      try {
        const response = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
          method: 'POST',
          body: formData,
        });
        
        const contentType = response.headers.get('content-type');
        console.log("Type de contenu reçu:", contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          handleQRCodeResponse(data);
        } else {
          // Si la méthode FormData ne fonctionne pas, essayons la méthode x-www-form-urlencoded
          console.log("Réponse non-JSON, retour vers méthode alternative");
          await sendWithURLEncoded(base64Image);
        }
      } catch (error) {
        console.error("Erreur avec la méthode FormData:", error);
        // Si la première méthode échoue, essayer la méthode alternative
        await sendWithURLEncoded(base64Image);
      }
    } catch (error) {
      console.error("Erreur lors du décodage du QR code:", error);
      Alert.alert(
        "Erreur de décodage",
        "Une erreur est survenue lors du décodage du QR code. Veuillez réessayer."
      );
      setProcessing(false);
    }
  };

  // Ajoutez cette fonction qui manque dans votre QRScanner.js
  const sendWithURLEncoded = async (base64Image) => {
    try {
      console.log("Tentative avec méthode URL encoded...");
      const apiUrl = 'https://api.qrserver.com/v1/read-qr-code/';
      
      const formData = new URLSearchParams();
      formData.append('filetocode', base64Image);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      if (response.ok) {
        const data = await response.json();
        handleQRCodeResponse(data);
      } else {
        // Si les deux méthodes échouent, réessayer avec une API alternative
        console.error("Les deux méthodes ont échoué, tentative avec ZXing");
        await sendToZXingAPI();
      }
    } catch (error) {
      console.error("Erreur avec la méthode URL encoded:", error);
      await sendToZXingAPI();
    }
  };

  // Fonction d'envoi à l'API ZXing (alternative)
  const sendToZXingAPI = async () => {
    try {
      console.log("Essai avec API ZXing...");
      
      // Utiliser une autre API pour décoder le QR (comme alternative)
      if (image) {
        // Pour les besoins de cette démonstration, on simule une réponse
        Alert.alert(
          "API de décodage non disponible",
          "Veuillez réessayer avec une autre photo.",
          [{ text: "OK", style: "cancel" }]
        );
      }
    } catch (error) {
      console.error("Erreur avec API ZXing:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Fonction pour gérer la réponse de l'API QR code
  const handleQRCodeResponse = (data) => {
    console.log("Réponse de l'API de décodage:", data);
    
    if (data && data[0] && data[0].symbol && data[0].symbol[0]) {
      let qrCodeData = '';
      
      if (data[0].symbol[0].data !== null) {
        qrCodeData = data[0].symbol[0].data;
      } else if (data[0].symbol[0].error) {
        throw new Error(data[0].symbol[0].error);
      } else {
        qrCodeData = data[0].symbol[0].raw || '';
      }
      
      // Traiter les données du QR code
      console.log("Contenu du QR code:", qrCodeData);
      processQRData(qrCodeData);
    } else {
      Alert.alert(
        "QR code introuvable",
        "Aucun QR code valide n'a été détecté dans l'image. Veuillez réessayer avec une autre photo."
      );
      setProcessing(false);
    }
  };

  // Modifié pour supprimer la partie sur les villes prédéfinies
  const processQRData = async (data) => {
    try {
      console.log("Traitement des données QR:", data);
      
      // Démarrer la navigation directement depuis le QR scanner
      const startNavigation = async (destination) => {
        try {
          setNavigating(true);
          
          // Obtenir la position actuelle
          const currentPosition = await getCurrentLocation();
          
          if (!currentPosition) {
            Alert.alert(
              "Erreur de localisation",
              "Impossible d'obtenir votre position actuelle. Vérifiez que la localisation est activée."
            );
            setNavigating(false);
            setProcessing(false);
            return;
          }
          
          // Utiliser le nouveau service de navigation directe
          const route = await startDirectNavigation(
            currentPosition,
            destination,
            false // avoidTolls par défaut
          );
          
          // Envoyer au composant parent avec toutes les informations
          onQRScanned({
            ...destination,
            route: route,
            direct: true,
            mode: destination.mode || "driving"  // S'assurer que le mode est toujours défini
          });
          
          onClose();
        } catch (error) {
          console.error("Erreur lors du démarrage de la navigation:", error);
          Alert.alert(
            "Erreur de navigation",
            "Impossible de calculer l'itinéraire. Veuillez réessayer."
          );
          setNavigating(false);
          setProcessing(false);
        }
      };
      
      // Gérer le format spécifique de vos QR codes Expo
      if (data.includes('exp://')) {
        console.log("Format Expo détecté");
        // Extraire les paramètres d'une URL Expo
        const urlObj = new URL(data);
        const params = new URLSearchParams(urlObj.search);
        
        const lat = parseFloat(params.get('lat'));
        const lon = parseFloat(params.get('lon') || params.get('lng'));
        const name = params.get('name') || 'Destination QR';
        const address = params.get('address') || '';
        
        if (!isNaN(lat) && !isNaN(lon)) {
          const destination = {
            latitude: lat,
            longitude: lon,
            name: name,
            address: address || name
          };
          
          // Démarrer la navigation directement
          await startNavigation(destination);
          return;
        }
      }
      
      // Format spécial pour gpsapp:// URLs
      if (data.startsWith('gpsapp://')) {
        console.log("Format gpsapp:// détecté");
        
        try {
          // Extraire les paramètres de l'URL personnalisée
          const urlParams = data.split('?')[1];
          const params = new URLSearchParams(urlParams);
          
          // Récupérer la destination et l'origine (qui sont des noms de lieux)
          const destination = params.get('destination');
          const mode = params.get('mode') || 'driving'; // Par défaut, mode conduite
          
          if (destination) {
            try {
              // Géocoder l'adresse en coordonnées GPS
              const geocoded = await geocodeAddress(destination);
              
              if (geocoded) {
                // Si le géocodage a réussi, utiliser les coordonnées obtenues
                console.log("Adresse géocodée avec succès:", geocoded);
                await startNavigation({
                  latitude: geocoded.latitude,
                  longitude: geocoded.longitude,
                  name: geocoded.name || destination,
                  address: geocoded.address || destination,
                  mode: mode
                });
                return;
              } else {
                // Si le géocodage échoue, proposer une recherche manuelle
                Alert.alert(
                  "Destination trouvée",
                  `Le QR code contient une destination: "${destination}"\n\nVoulez-vous essayer de rechercher cette destination?`,
                  [
                    { text: "Annuler", style: "cancel" },
                    { 
                      text: "Rechercher", 
                      onPress: () => {
                        // Fermer le scanner et retourner au composant parent pour la recherche
                        onQRScanned({
                          searchTerm: destination,
                          direct: false
                        });
                        onClose();
                      }
                    }
                  ]
                );
              }
            } catch (error) {
              console.error("Erreur lors du traitement de l'adresse:", error);
              Alert.alert(
                "Erreur",
                "Impossible de convertir cette adresse en coordonnées GPS."
              );
            }
            return;
          }
        } catch (e) {
          console.error('Erreur URL gpsapp:', e);
        }
      }
      
      // Essayer de parser comme JSON
      try {
        const jsonData = JSON.parse(data);
        if (jsonData && jsonData.latitude && jsonData.longitude) {
          const destination = {
            latitude: jsonData.latitude,
            longitude: jsonData.longitude,
            name: jsonData.name || 'Destination QR',
            address: jsonData.address || jsonData.name || 'Destination QR'
          };
          
          // Démarrer la navigation directement
          await startNavigation(destination);
          return;
        }
      } catch (e) {
        // Ce n'est pas du JSON, on continue
        console.log("Le contenu n'est pas du JSON valide, essai d'autres formats");
      }
      
      // Format: latitude,longitude
      if (data.match(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)) {
        const [lat, lng] = data.split(',').map(coord => parseFloat(coord.trim()));
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const destination = {
            latitude: lat,
            longitude: lng,
            name: 'Destination QR',
            address: `Coordonnées GPS: ${lat}, ${lng}`
          };
          
          // Démarrer la navigation directement
          await startNavigation(destination);
          return;
        }
      }

      // Format URL avec coordonnées
      if (data.includes('lat=') && (data.includes('lon=') || data.includes('lng='))) {
        try {
          let params = {};
          
          if (data.includes('?')) {
            // URL complète
            const urlParts = data.split('?')[1].split('&');
            
            urlParts.forEach(part => {
              const [key, value] = part.split('=');
              if (key && value) {
                params[key] = decodeURIComponent(value);
              }
            });
          } else {
            // Juste les paramètres sans URL
            const urlParts = data.split('&');
            
            urlParts.forEach(part => {
              const [key, value] = part.split('=');
              if (key && value) {
                params[key] = decodeURIComponent(value);
              }
            });
          }
          
          const lat = parseFloat(params.lat);
          const lon = parseFloat(params.lon || params.lng);
          const name = params.name || 'Destination QR';
          const address = params.address || name || `Coordonnées GPS: ${lat}, ${lon}`;
          
          if (!isNaN(lat) && !isNaN(lon)) {
            const destination = { 
              latitude: lat, 
              longitude: lon,
              name: name,
              address: address
            };
            
            // Démarrer la navigation directement
            await startNavigation(destination);
            return;
          }
        } catch (e) {
          console.error('Erreur URL:', e);
        }
      }
      
      // Format non reconnu
      Alert.alert(
        "Format non reconnu",
        `Le QR code contient: "${data}"\n\nCe n'est pas un format de coordonnées reconnu.`,
        [{ text: "OK", style: "cancel" }]
      );
      setProcessing(false);
      
    } catch (error) {
      console.error('Erreur de traitement QR:', error);
      Alert.alert("Erreur", "Impossible de traiter les données du QR code: " + error.message);
      setProcessing(false);
    }
  };

  // Fonction pour prendre une photo avec la caméra
  const takePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "Vous devez autoriser l'accès à la caméra pour prendre des photos.");
        return;
      }
      
      setProcessing(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        // Décoder le QR code de l'image
        await decodeQRCode(result.assets[0].uri);
      } else {
        setProcessing(false);
      }
    } catch (error) {
      setProcessing(false);
      console.error("Erreur lors de la prise de photo:", error);
      Alert.alert("Erreur", "Impossible de prendre la photo: " + error.message);
    }
  };

  // Fonction pour sélectionner une image dans la galerie
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "Vous devez autoriser l'accès à la galerie pour choisir des photos.");
        return;
      }
      
      setProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        // Décoder le QR code de l'image
        await decodeQRCode(result.assets[0].uri);
      } else {
        setProcessing(false);
      }
    } catch (error) {
      setProcessing(false);
      console.error("Erreur lors de la sélection d'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image: " + error.message);
    }
  };

  // Ajoutez cette fonction de géocodage
  const geocodeAddress = async (address) => {
    try {
      console.log("Géocodage de l'adresse:", address);
      // Utiliser l'API de géocodage (ici, exemple avec l'API Nominatim d'OpenStreetMap qui est gratuite)
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          addressdetails: 1,
          limit: 1
        },
        headers: {
          'Accept-Language': 'fr',
          'User-Agent': 'YourAppName/1.0' // Indiquez le nom de votre app pour respecter les conditions d'utilisation
        }
      });
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          name: result.display_name.split(',')[0],
          address: result.display_name
        };
      }
      return null;
    } catch (error) {
      console.error("Erreur lors du géocodage:", error);
      return null;
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Scanner un QR code</Text>
          <View style={{width: 28}} />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Options pour scanner un QR code */}
          <View style={styles.scanOptions}>
            <TouchableOpacity 
              style={[styles.scanOption, styles.cameraOption, processing && styles.disabledButton]} 
              onPress={takePicture}
              disabled={processing}
            >
              <Ionicons name="camera" size={28} color="#fff" />
              <Text style={styles.scanOptionText}>Prendre une photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.scanOption, styles.galleryOption, processing && styles.disabledButton]} 
              onPress={pickImage}
              disabled={processing}
            >
              <Ionicons name="images" size={28} color="#fff" />
              <Text style={styles.scanOptionText}>Choisir une image</Text>
            </TouchableOpacity>
          </View>

          {/* Affichage de l'image sélectionnée avec indicateur de traitement */}
          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.selectedImage} />
              {processing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={styles.processingText}>Analyse du QR code...</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Comment utiliser :</Text>
            <Text style={styles.helpText}>1. Prenez une photo d'un QR code ou sélectionnez une image</Text>
            <Text style={styles.helpText}>2. Patientez pendant l'analyse du QR code</Text>
            <Text style={styles.helpText}>3. La navigation démarrera automatiquement si le QR contient des coordonnées valides</Text>
          </View>
        </ScrollView>

        {/* Ajouter un indicateur de navigation */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scanOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scanOption: {
    flex: 1,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cameraOption: {
    backgroundColor: '#2196F3',
  },
  galleryOption: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.6,
  },
  scanOptionText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
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
  helpBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#9e9e9e',
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 5,
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