const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Plateforme Communale Sénégal - Démarrage réussi!',
    version: '1.0.0',
    endpoints: [
      '/api/communes',
      '/api/ressources', 
      '/api/auth'
    ]
  });
});

// Import des routes
const communesRoutes = require('./routes/communes');
const ressourcesRoutes = require('./routes/ressources');
const authRoutes = require('./routes/auth');

app.use('/api/communes', communesRoutes);
app.use('/api/ressources', ressourcesRoutes);
app.use('/api/auth', authRoutes);

// Middleware de gestion des erreurs 404 - CORRIGÉ
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route non trouvée',
    path: req.path
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