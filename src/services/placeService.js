/**
 * Service de gestion des lieux et destinations
 */

/**
 * Transforme un objet place en format de destination standard
 */
export const formatDestination = (place) => {
    if (!place) return null;
    
    return place.structured_formatting 
      ? {
          name: place.structured_formatting.main_text,
          address: place.structured_formatting.secondary_text,
          latitude: place.geometry?.location?.lat,
          longitude: place.geometry?.location?.lng
        }
      : {
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude
        };
  };
  
  /**
   * Calcule la distance entre deux points GPS en mètres
   */
  export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
  
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  /**
   * Vérifie si l'utilisateur est arrivé à destination
   * @param {object} location - Position actuelle
   * @param {object} destination - Destination
   * @param {number} threshold - Seuil de distance en mètres
   * @returns {boolean} - True si arrivé
   */
  export const checkArrival = (location, destination, threshold = 50) => {
    if (!location?.coords || !destination) return false;
    
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      destination.latitude,
      destination.longitude
    );
    
    return distance <= threshold;
  };