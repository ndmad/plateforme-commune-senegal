const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOG TEMPORAIRE pour debug
app.use((req, res, next) => {
  console.log('📨 Requête:', req.method, req.url);
  next();
});

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Plateforme Communale Sénégal',
    version: '1.0.0'
  });
});

// Import des routes
console.log('🔄 Chargement des routes...');
const communesRoutes = require('./routes/communes');
const ressourcesRoutes = require('./routes/ressources');
const authRoutes = require('./routes/auth');

app.use('/api/communes', communesRoutes);
app.use('/api/ressources', ressourcesRoutes);
app.use('/api/auth', authRoutes);

console.log('✅ Routes chargées: /api/communes, /api/ressources, /api/auth');

// Middleware de gestion des erreurs 404
app.use((req, res) => {
  console.log('❌ Route non trouvée:', req.method, req.url);
  res.status(404).json({ 
    success: false,
    error: 'Route non trouvée',
    path: req.url
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});