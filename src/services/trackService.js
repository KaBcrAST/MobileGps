import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache des objets sonores pour éviter les chargements multiples
const soundCache = {};

// Clé pour stocker la préférence sonore
const SOUND_ENABLED_KEY = 'soundEnabled';

// État interne du service
let soundEnabled = true;

/**
 * Vérifie si les sons sont activés
 * @returns {Promise<boolean>} État d'activation des sons
 */
const isSoundEnabled = async () => {
  try {
    const savedPref = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    console.log(`📚 Préférence sonore récupérée: "${savedPref}"`);
    
    // Évaluer clairement la valeur stockée
    if (savedPref !== null) {
      soundEnabled = savedPref === 'true';
      console.log(`🔊 État sonore défini à: ${soundEnabled}`);
    } else {
      console.log(`🔊 Aucune préférence trouvée, utilisation de la valeur par défaut: ${soundEnabled}`);
    }
    
    return soundEnabled;
  } catch (error) {
    console.error('❌ Erreur lors de la lecture des préférences sonores:', error);
    return soundEnabled;
  }
};

/**
 * Active ou désactive les sons
 * @param {boolean} enabled - État d'activation souhaité
 * @returns {Promise<boolean>} Succès ou échec de l'opération
 */
const setSoundEnabled = async (enabled) => {
  try {
    // Convertir en booléen explicitement pour éviter les confusions
    enabled = Boolean(enabled);
    soundEnabled = enabled;
    
    // Utiliser une chaîne claire pour le stockage
    const valueToStore = enabled ? 'true' : 'false';
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, valueToStore);
    
    console.log(`🔊 Sons ${enabled ? 'activés' : 'désactivés'} (valeur stockée: ${valueToStore})`);
    
    if (!enabled) {
      // Si on désactive le son, arrêter tous les sons en cours
      await stopAllSounds();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la modification des préférences sonores:', error);
    return false;
  }
};

/**
 * Initialise le système audio
 * @returns {Promise<boolean>} Succès ou échec de l'initialisation
 */
const setupTrackService = async () => {
  try {
    // Charger la préférence sonore
    await isSoundEnabled();
    
    // Initialiser le système audio même si les sons sont désactivés
    // pour permettre une activation ultérieure sans redémarrage
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    console.log(`✅ Système audio initialisé avec succès (sons ${soundEnabled ? 'activés' : 'désactivés'})`);
    return true;
  } catch (error) {
    console.error('❌ Échec de l\'initialisation audio:', error);
    return false;
  }
};

/**
 * Charge un son pour utilisation ultérieure
 * @param {string} id - Identifiant unique du son
 * @param {any} source - Source du son (require() ou uri)
 * @param {string} title - Titre du son (pour logs uniquement)
 * @returns {Promise<boolean>} Succès ou échec du chargement
 */
const loadSound = async (id, source, title = 'Sound Effect') => {
  try {
    if (soundCache[id]) {
      return true; // Le son est déjà chargé
    }
    
    const sound = new Audio.Sound();
    await sound.loadAsync(source);
    
    // Stocker le son dans le cache
    soundCache[id] = { sound, title };
    console.log(`🔊 Son "${title}" (${id}) chargé avec succès`);
    return true;
  } catch (error) {
    console.error(`❌ Échec du chargement du son "${id}":`, error);
    return false;
  }
};

/**
 * Joue un son préalablement chargé
 * @param {string} id - Identifiant du son à jouer
 * @param {number} volume - Volume (0.0 à 1.0)
 * @returns {Promise<boolean>} Succès ou échec de la lecture
 */
const playSound = async (id, volume = 0.1) => {
  // Vérifier explicitement l'état de soundEnabled à chaque appel
  await isSoundEnabled();
  
  // Vérifier si les sons sont activés
  if (!soundEnabled) {
    console.log(`⏭️ Son "${id}" ignoré (sons désactivés) - état actuel: ${soundEnabled}`);
    return false;
  }
  
  try {
    const soundData = soundCache[id];
    if (!soundData) {
      console.warn(`⚠️ Son "${id}" non trouvé dans le cache`);
      return false;
    }
    
    const { sound, title } = soundData;
    
    // Réinitialiser le son s'il est en cours de lecture
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      // Arrêter le son s'il est en cours de lecture
      if (status.isPlaying) {
        await sound.stopAsync();
      }
      // Revenir au début
      await sound.setPositionAsync(0);
    }
    
    // Définir le volume
    await sound.setVolumeAsync(volume);
    
    // Jouer le son
    await sound.playAsync();
    console.log(`▶️ Lecture du son "${title}" (${id}) à volume ${volume} - état sonore: ${soundEnabled}`);
    return true;
  } catch (error) {
    console.error(`❌ Échec de lecture du son "${id}":`, error);
    return false;
  }
};

/**
 * Arrête tous les sons en cours de lecture
 * @returns {Promise<boolean>} Succès ou échec de l'opération
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
    console.log('⏹️ Tous les sons ont été arrêtés');
    return true;
  } catch (error) {
    console.error('❌ Échec de l\'arrêt des sons:', error);
    return false;
  }
};

/**
 * Nettoie les ressources audio
 * @returns {Promise<boolean>} Succès ou échec du nettoyage
 */
const cleanupPlayer = async () => {
  try {
    const ids = Object.keys(soundCache);
    for (const id of ids) {
      const { sound } = soundCache[id];
      await sound.unloadAsync();
      delete soundCache[id];
    }
    console.log('🧹 Ressources audio nettoyées');
    return true;
  } catch (error) {
    console.error('❌ Échec du nettoyage audio:', error);
    return false;
  }
};

// Fonction fictive pour maintenir la compatibilité avec l'API précédente
const TrackPlayerService = async function() {
  // Cette fonction reste vide car nous n'utilisons plus TrackPlayer
};

// Export groupé de toutes les fonctions
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