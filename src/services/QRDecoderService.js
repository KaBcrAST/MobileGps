import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

const prepareImage = async (imageUri) => {
  const manipResult = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 600 } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 }
  );
  const base64Image = await FileSystem.readAsStringAsync(manipResult.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  return { manipResult, base64Image };
};

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

const decodeWithZXing = async () => {
  Alert.alert(
    "API de décodage non disponible",
    "Veuillez réessayer avec une autre photo.",
    [{ text: "OK", style: "cancel" }]
  );
  
  return null;
};

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
export const decodeQRCode = async (imageUri) => {
  try {
    const { manipResult, base64Image } = await prepareImage(imageUri);
    
    let qrData = null;
    
    try {
      const formDataResult = await decodeWithFormData(manipResult);
      if (formDataResult) {
        qrData = extractQRContent(formDataResult);
        if (qrData) return qrData;
      }
    } catch (error) {
      console.error("Erreur avec FormData:", error);
    }
    
    
    try {
      const urlEncodedResult = await decodeWithURLEncoded(base64Image);
      if (urlEncodedResult) {
        qrData = extractQRContent(urlEncodedResult);
        if (qrData) return qrData;
      }
    } catch (error) {
      console.error("Erreur avec URL encoded:", error);
    }
    
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