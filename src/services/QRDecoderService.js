import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

/**
 * Redimensionne et prépare l'image pour l'envoi
 */
const prepareImage = async (imageUri) => {
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
  
  return { manipResult, base64Image };
};

/**
 * Essaie de décoder le QR code avec FormData
 */
const decodeWithFormData = async (manipResult) => {
  const formData = new FormData();
  formData.append('file', {
    uri: manipResult.uri,
    type: 'image/jpeg',
    name: 'qr_image.jpg',
  });
  
  const response = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
    method: 'POST',
    body: formData,
  });
  
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return null;
};

/**
 * Essaie de décoder le QR code avec URLEncoded
 */
const decodeWithURLEncoded = async (base64Image) => {
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
    return await response.json();
  }
  
  return null;
};

/**
 * Essaie de décoder le QR code avec l'API ZXing (alternative)
 */
const decodeWithZXing = async () => {
  // Cette méthode est un fallback, qui pourrait être implémentée plus tard
  Alert.alert(
    "API de décodage non disponible",
    "Veuillez réessayer avec une autre photo.",
    [{ text: "OK", style: "cancel" }]
  );
  
  return null;
};

/**
 * Extrait le contenu du QR code de la réponse de l'API
 */
const extractQRContent = (data) => {
  if (data && data[0] && data[0].symbol && data[0].symbol[0]) {
    if (data[0].symbol[0].data !== null) {
      return data[0].symbol[0].data;
    } else if (data[0].symbol[0].error) {
      throw new Error(data[0].symbol[0].error);
    } else {
      return data[0].symbol[0].raw || '';
    }
  }
  
  return null;
};

/**
 * Fonction principale de décodage de QR code
 */
export const decodeQRCode = async (imageUri) => {
  try {
    console.log("Préparation de l'image pour décodage...");
    const { manipResult, base64Image } = await prepareImage(imageUri);
    
    // Essayer les différentes méthodes dans l'ordre
    let qrData = null;
    
    console.log("Tentative de décodage via FormData...");
    try {
      const formDataResult = await decodeWithFormData(manipResult);
      if (formDataResult) {
        qrData = extractQRContent(formDataResult);
        if (qrData) return qrData;
      }
    } catch (error) {
      console.error("Erreur avec FormData:", error);
    }
    
    console.log("Tentative de décodage via URL encoded...");
    try {
      const urlEncodedResult = await decodeWithURLEncoded(base64Image);
      if (urlEncodedResult) {
        qrData = extractQRContent(urlEncodedResult);
        if (qrData) return qrData;
      }
    } catch (error) {
      console.error("Erreur avec URL encoded:", error);
    }
    
    console.log("Tentative de décodage avec ZXing...");
    try {
      const zxingResult = await decodeWithZXing();
      if (zxingResult) {
        qrData = extractQRContent(zxingResult);
        if (qrData) return qrData;
      }
    } catch (error) {
      console.error("Erreur avec ZXing:", error);
    }
    
    if (!qrData) {
      Alert.alert(
        "QR code introuvable",
        "Aucun QR code valide n'a été détecté dans l'image. Veuillez réessayer avec une autre photo."
      );
      return null;
    }
    
    return qrData;
    
  } catch (error) {
    console.error("Erreur lors du décodage du QR code:", error);
    Alert.alert(
      "Erreur de décodage",
      "Une erreur est survenue lors du décodage du QR code. Veuillez réessayer."
    );
    return null;
  }
};