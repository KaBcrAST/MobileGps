import * as Location from 'expo-location';

export const getCurrentLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.error('Permission de localisation refusée');
    return null;
  }

  const location = await Location.getCurrentPositionAsync({});
  return location.coords;
};