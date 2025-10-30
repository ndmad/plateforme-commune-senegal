
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// NOUVEAU: Importer les middlewares de sécurité
const { securityMiddleware, authLimiter, apiLimiter } = require('./middleware/security')

dotenv.config();

const app = express();

// NOUVEAU: Middlewares de sécurité
app.use(securityMiddleware);
app.use('/api/auth/login', authLimiter);
app.use('/api/', apiLimiter);


// Middleware de base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  MIDDLEWARE AUDIT DOIT ÊTRE ICI - AVANT LES ROUTES 
const { auditMiddleware } = require('./middleware/audit');
app.use(auditMiddleware);

// Routes existantes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ressources', require('./routes/ressources'));
app.use('/api/communes', require('./routes/communes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/statistiques', require('./routes/statistiques'));

// NOUVELLES ROUTES DE SÉCURITÉ
app.use('/api/security', require('./routes/security'));

// Routes GDPR (COMMENTER TEMPORAIREMENT SI BESOIN)
// app.use('/api/gdpr', require('./routes/gdpr'));

// ✅ AJOUTEZ CETTE LIGNE :
app.use('/api/ansd', require('./routes/ansd'));



// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Plateforme Communale en fonctionnement',
    timestamp: new Date().toISOString()
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

module.exports = app;