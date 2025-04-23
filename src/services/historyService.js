import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://react-gpsapi.vercel.app';
const HISTORY_KEY = 'destinationHistory';
const MAX_HISTORY_ITEMS = 5;

export const addToHistory = async (userId, destination) => {
  try {
    const response = await fetch(`${API_URL}/history/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, destination })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    return data.history;
  } catch (error) {
    console.error('Error adding to history:', error);
    return [];
  }
};

export const getHistory = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/history/${userId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }

    return data.history;
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

export const clearHistory = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/history/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
};