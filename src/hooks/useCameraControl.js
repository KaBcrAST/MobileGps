/**
 * Fichier de compatibilité pour les imports existants
 * Ce fichier réexporte simplement useMapCamera pour les composants 
 * qui cherchent à importer useCameraControl
 */

import useMapCamera from './useMapCamera';

// Exporter useMapCamera comme export par défaut
export default useMapCamera;

// Aussi exporter nommément pour les imports nommés
export const useCameraControl = useMapCamera;