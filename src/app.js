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

app.use('/api/statistiques', require('./routes/statistiques'));

// Import et utilisation des routes - CORRECTION : d'abord importer, puis utiliser
const communesRoutes = require('./routes/communes');
const ressourcesRoutes = require('./routes/ressources');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Routes API
app.use('/api/communes', communesRoutes);
app.use('/api/ressources', ressourcesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

console.log('✅ Routes chargées: /api/communes, /api/ressources, /api/auth, /api/admin');

// Middleware de gestion des erreurs 404
app.use((req, res) => {
  console.log('❌ Route non trouvée:', req.method, req.url);
  res.status(404).json({ 
    success: false,
    error: 'Route non trouvée',
    path: req.url
  });
});

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

module.exports = app;