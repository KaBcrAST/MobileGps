import { Alert } from 'react-native';
import { geocodeAddress } from './GeolocationService';

/**
 * @param {string} data
 * @param {function} navigationHandler
 * @param {function} searchHandler
 */
export const processQRData = async (data, navigationHandler, searchHandler) => {
  try {
    console.log("Traitement des données QR:", data);
    
    if (data.includes('exp://')) {
      const expoData = processExpoFormat(data);
      if (expoData) {
        await navigationHandler(expoData);
        return;
      }
    }
    
    if (data.startsWith('gpsapp://')) {
      console.log("Format gpsapp:// détecté");
      const result = await processGpsAppFormat(data, navigationHandler, searchHandler);
      if (result) return;
    }
    
    try {
      const jsonResult = processJsonFormat(data);
      if (jsonResult) {
        await navigationHandler(jsonResult);
        return;
      }
    } catch (e) {
      console.error('Erreur traitement format JSON:', e);}
    
    if (processCoordinatesFormat(data, navigationHandler)) {
      return;
    }
    
    if (processURLParamsFormat(data, navigationHandler)) {
      return;
    }
    
    Alert.alert(
      "Format non reconnu",
      `Le QR code contient: "${data}"\n\nCe n'est pas un format de coordonnées reconnu.`,
      [{ text: "OK", style: "cancel" }]
    );
    
  } catch (error) {
    Alert.alert("Erreur", "Impossible de traiter les données du QR code: " + error.message);
    throw error;
  }
};

const processExpoFormat = (data) => {
  try {
    const urlObj = new URL(data);
    const params = new URLSearchParams(urlObj.search);
    
    const lat = parseFloat(params.get('lat'));
    const lon = parseFloat(params.get('lon') || params.get('lng'));
    const name = params.get('name') || 'Destination QR';
    const address = params.get('address') || '';
    
    if (!isNaN(lat) && !isNaN(lon)) {
      return {
        latitude: lat,
        longitude: lon,
        name: name,
        address: address || name
      };
    }
  } catch (e) {
    console.error('Erreur traitement format Expo:', e);
  }
  return null;
};

const processGpsAppFormat = async (data, navigationHandler, searchHandler) => {
  try {
    const urlParams = data.split('?')[1];
    const params = new URLSearchParams(urlParams);
    
    const destination = params.get('destination');
    const mode = params.get('mode') || 'driving';
    
    if (destination) {
      try {
        const geocoded = await geocodeAddress(destination);
        
        if (geocoded) {
          console.log("Adresse géocodée avec succès:", geocoded);
          await navigationHandler({
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
            name: geocoded.name || destination,
            address: geocoded.address || destination,
            mode: mode
          });
          return true;
        } else {
          Alert.alert(
            "Destination trouvée",
            `Le QR code contient une destination: "${destination}"\n\nVoulez-vous essayer de rechercher cette destination?`,
            [
              { text: "Annuler", style: "cancel" },
              { 
                text: "Rechercher", 
                onPress: () => searchHandler(destination)
              }
            ]
          );
          return true;
        }
      } catch (error) {
        Alert.alert(
          "Erreur",
          "Impossible de convertir cette adresse en coordonnées GPS."
        );
        return true;
      }
    }
  } catch (e) {
    console.error('Erreur URL gpsapp:', e);
  }
  return false;
};

const processJsonFormat = (data) => {
  const jsonData = JSON.parse(data);
  if (jsonData && jsonData.latitude && jsonData.longitude) {
    return {
      latitude: jsonData.latitude,
      longitude: jsonData.longitude,
      name: jsonData.name || 'Destination QR',
      address: jsonData.address || jsonData.name || 'Destination QR'
    };
  }
  return null;
};

const processCoordinatesFormat = async (data, navigationHandler) => {
  if (data.match(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)) {
    const [lat, lng] = data.split(',').map(coord => parseFloat(coord.trim()));
    
    if (!isNaN(lat) && !isNaN(lng)) {
      const destination = {
        latitude: lat,
        longitude: lng,
        name: 'Destination QR',
        address: `Coordonnées GPS: ${lat}, ${lng}`
      };
      
      await navigationHandler(destination);
      return true;
    }
  }
  return false;
};

const processURLParamsFormat = async (data, navigationHandler) => {
  if (data.includes('lat=') && (data.includes('lon=') || data.includes('lng='))) {
    try {
      let params = {};
      
      if (data.includes('?')) {
        const urlParts = data.split('?')[1].split('&');
        
        urlParts.forEach(part => {
          const [key, value] = part.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });
      } else {
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
        
        await navigationHandler(destination);
        return true;
      }
    } catch (e) {
      console.error('Erreur URL:', e);
    }
  }
  return false;
};