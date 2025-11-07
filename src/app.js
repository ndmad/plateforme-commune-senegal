// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Importer les middlewares de sécurité
const { securityMiddleware, authLimiter, apiLimiter } = require('./middleware/security')

dotenv.config();

const app = express();

// ============================================================================
// CONFIGURATION CORS POUR TEST MOBILE
// ============================================================================

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser toutes les origines en développement
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // En production, vérifier les origines autorisées
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.43.103:3000',
      'http://10.0.2.2:3000'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// MIDDLEWARE CORS DOIT ÊTRE AVANT TOUT
app.use(cors(corsOptions));

// NOUVEAU: Middlewares de sécurité
app.use(securityMiddleware);
app.use('/api/auth/login', authLimiter);
app.use('/api/', apiLimiter);

// Middleware de base
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MIDDLEWARE AUDIT
const { auditMiddleware } = require('./middleware/audit');
app.use(auditMiddleware);

// ============================================================================
// ROUTE DE SANTÉ POUR TEST RAPIDE
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Plateforme Communale en fonctionnement',
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    clientHeaders: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent']
    }
  });
});

// ============================================================================
// ROUTES EXISTANTES
// ============================================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ressources', require('./routes/ressources'));
app.use('/api/communes', require('./routes/communes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/statistiques', require('./routes/statistiques'));

// NOUVELLES ROUTES DE SÉCURITÉ
app.use('/api/security', require('./routes/security'));

// Routes GDPR (COMMENTER TEMPORAIREMENT SI BESOIN)
// app.use('/api/gdpr', require('./routes/gdpr'));

app.use('/api/ansd', require('./routes/ansd'));
app.use('/api/geographie', require('./routes/geographie'));
app.use('/api/meteo', require('./routes/meteo'));

// ============================================================================
// ROUTE PING SIMPLE POUR TEST MOBILE
// ============================================================================

app.get('/api/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong',
    clientIP: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  
  // Si c'est une erreur CORS
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit par la politique CORS'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = app;