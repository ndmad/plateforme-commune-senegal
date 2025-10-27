// frontend/src/config.js

// Configuration dynamique de l'API
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    
    // Si on est en localhost (développement sur PC)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    
    // Si on est sur mobile, utilise l'IP du PC
    // ⚠️ REMPLACEZ 192.168.1.50 par VOTRE IP RÉELLE !
    return 'http://192.168.43.103:5000/api';
  };
  
  export const API_BASE_URL = getApiBaseUrl();
  console.log('🔧 Configuration API:', API_BASE_URL);