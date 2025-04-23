import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_HISTORY_KEY = 'localDestinationHistory';
const MAX_HISTORY_ITEMS = 3; // Change max items to 3

export const addToLocalHistory = async (destination) => {
  try {
    const existingHistory = await AsyncStorage.getItem(LOCAL_HISTORY_KEY);
    let history = existingHistory ? JSON.parse(existingHistory) : [];
    
    // Add timestamp if not present
    const destinationWithTimestamp = {
      ...destination,
      timestamp: destination.timestamp || new Date().toISOString()
    };
    
    history.unshift(destinationWithTimestamp);
    history = history.slice(0, MAX_HISTORY_ITEMS); // Keep only 3 items
    
    await AsyncStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (error) {
    console.error('Error adding to local history:', error);
    return [];
  }
};

export const getLocalHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(LOCAL_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting local history:', error);
    return [];
  }
};

export const removeFromLocalHistory = async (timestamp) => {
  try {
    const existingHistory = await AsyncStorage.getItem(LOCAL_HISTORY_KEY);
    if (!existingHistory) return [];

    let history = JSON.parse(existingHistory);
    history = history.filter(item => item.timestamp !== timestamp);
    
    await AsyncStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (error) {
    console.error('Error removing from history:', error);
    return [];
  }
};