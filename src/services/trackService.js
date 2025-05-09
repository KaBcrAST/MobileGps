import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const soundCache = {};
const SOUND_ENABLED_KEY = 'soundEnabled';
let soundEnabled = true;

/**
 * @returns {Promise<boolean>} 
 */
const isSoundEnabled = async () => {
  try {
    const savedPref = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    if (savedPref !== null) {
      soundEnabled = savedPref === 'true';
    } else {
      soundEnabled = true;
     }
    
    return soundEnabled;
  } catch (error) {
    return soundEnabled;
  }
};

/**
 * @param {boolean} enabled
 * @returns {Promise<boolean>}
 */
const setSoundEnabled = async (enabled) => {
  try {
    enabled = Boolean(enabled);
    soundEnabled = enabled;
    
    const valueToStore = enabled ? 'true' : 'false';
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, valueToStore);
        
    if (!enabled) {
      await stopAllSounds();
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * @returns {Promise<boolean>}
 */
const setupTrackService = async () => {
  try {
    await isSoundEnabled();
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * @param {string} id
 * @param {any} source
 * @param {string} title
 * @returns {Promise<boolean>}
 */
const loadSound = async (id, source, title = 'Sound Effect') => {
  try {
    if (soundCache[id]) {
      return true;
    }
    
    const sound = new Audio.Sound();
    await sound.loadAsync(source);
    

    soundCache[id] = { sound, title };
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * @param {string} id
 * @param {number} volume
 * @returns {Promise<boolean>}
 */
const playSound = async (id, volume = 0.1) => {
  await isSoundEnabled();
  
  if (!soundEnabled) {
    return false;
  }
  
  try {
    const soundData = soundCache[id];
    if (!soundData) {
      return false;
    }
    
    const { sound, title } = soundData;
    
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await sound.stopAsync();
      }
      await sound.setPositionAsync(0);
    }
    await sound.setVolumeAsync(volume);
    
    await sound.playAsync();
    console.log(`▶️ Lecture du son "${title}" (${id}) à volume ${volume} - état sonore: ${soundEnabled}`);
    return true;
  } catch (error) {
    console.error(`❌ Échec de lecture du son "${id}":`, error);
    return false;
  }
};

/**
 * @returns {Promise<boolean>}
 */
const stopAllSounds = async () => {
  try {
    const ids = Object.keys(soundCache);
    for (const id of ids) {
      const { sound } = soundCache[id];
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
      }
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * @returns {Promise<boolean>}
 */
const cleanupPlayer = async () => {
  try {
    const ids = Object.keys(soundCache);
    for (const id of ids) {
      const { sound } = soundCache[id];
      await sound.unloadAsync();
      delete soundCache[id];
    }
    return true;
  } catch (error) {
    return false;
  }
};

const TrackPlayerService = async function() {
};

export {
  setupTrackService,
  loadSound,
  playSound,
  stopAllSounds,
  cleanupPlayer,
  isSoundEnabled,
  setSoundEnabled,
  TrackPlayerService
};