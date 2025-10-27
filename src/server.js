const app = require('./app');

const PORT = process.env.PORT || 5000;

// 🚨 REMPLACEZ l'app.listen existant par :
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 URL locale: http://localhost:${PORT}`);
  console.log(`📱 URL mobile: http://[VOTRE-IP]:${PORT}`);
  console.log(`🌐 Écoute sur toutes les interfaces: 0.0.0.0`);
});