/**
 * Utilitaires de formatage pour l'affichage des informations de navigation
 */

/**
 * Formate une valeur générique (durée, distance) en texte lisible
 */
export const formatValue = (value) => {
  if (!value) return '';
  
  if (typeof value === 'object') {
    if (value.text) return value.text;
    if (value.value) {
      // Convertir secondes en minutes pour la durée
      if (value.value >= 60) return `${Math.round(value.value / 60)} min`;
      return `${value.value} s`;
    }
  }
  
  return value;
};

/**
 * Formate une distance en texte lisible
 */
export const formatDistance = (distanceValue) => {
  if (!distanceValue) return '-- km';
  
  let dist;
  let unit = 'km';
  
  if (typeof distanceValue === 'object' && distanceValue.value) {
    dist = distanceValue.value / 1000; // Convertir mètres en km
  } else if (typeof distanceValue === 'number') {
    dist = distanceValue / 1000;
  } else if (typeof distanceValue === 'string') {
    // Si c'est déjà formaté (comme "5,2 km"), on le renvoie tel quel
    return distanceValue;
  } else {
    return '-- km';
  }
  
  // Afficher en mètres si moins de 1 km
  if (dist < 1) {
    dist = Math.round(dist * 1000);
    unit = 'm';
  } else {
    // Arrondir à 1 décimale pour les km
    dist = Math.round(dist * 10) / 10;
  }
  
  return `${dist} ${unit}`;
};

/**
 * Calcule et formate l'heure d'arrivée estimée
 */
export const getArrivalTime = (duration) => {
  if (!duration) return '--:--';
  
  const now = new Date();
  let durationInMinutes;
  
  if (typeof duration === 'object' && duration.value) {
    // Si la durée est un objet Google Maps API avec une propriété 'value' en secondes
    durationInMinutes = Math.round(duration.value / 60);
  } else if (typeof duration === 'string') {
    // Si la durée est une chaîne comme "10 min"
    const match = duration.match(/(\d+)/);
    durationInMinutes = match ? parseInt(match[0], 10) : 0;
  } else if (typeof duration === 'number') {
    // Si c'est déjà un nombre (en secondes probablement)
    durationInMinutes = Math.round(duration / 60);
  } else {
    return '--:--';
  }
  
  // Calculer l'heure d'arrivée
  const arrivalTime = new Date(now.getTime() + (durationInMinutes * 60 * 1000));
  
  // Formater l'heure au format français
  return arrivalTime.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};