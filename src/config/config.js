// URL de l'API définie directement sans dépendre de variables d'environnement
export const API_URL = 'https://react-gpsapi.vercel.app';


// Optionnellement, vous pouvez définir les endpoints pour plus de clarté
export const API_ENDPOINTS = {
  auth: {
    login: 'auth/login',
    google: '/api/auth/google',
    register: '/api/auth/register'
  },
  map: {
    config: '/api/map/config',
    reports: '/api/reports'
  }
};