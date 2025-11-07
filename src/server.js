// server.js
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Démarrer sur toutes les interfaces réseau
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur API démarré sur le port ${PORT}`);
  console.log(`📍 Accès local: http://localhost:${PORT}`);
  console.log(`📱 Accès réseau: http://192.168.43.103:${PORT}`);
  console.log(`🌍 Accès depuis mobile: http://VOTRE_IP_MOBILE:${PORT}`);
  console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
});