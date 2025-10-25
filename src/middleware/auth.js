const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_par_defaut');
    
    const result = await db.query(
      'SELECT id, nom, email, role, commune_id, telephone, actif FROM utilisateurs WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const user = result.rows[0];
    
    if (!user.actif) {
      return res.status(401).json({
        success: false,
        error: 'Compte désactivé'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

// Middleware pour vérifier les rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Accès refusé. Rôles autorisés: ${roles.join(', ')}. Votre rôle: ${req.user.role}`
      });
    }

    next();
  };
};

// Middleware pour vérifier la propriété ou le rôle admin
const requireOwnershipOrAdmin = (tableName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise'
        });
      }

      // Les admins peuvent tout faire
      if (req.user.role === 'admin') {
        return next();
      }

      // Vérifier si l'utilisateur est le propriétaire
      const result = await db.query(
        `SELECT created_by FROM ${tableName} WHERE id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ressource non trouvée'
        });
      }

      if (result.rows[0].created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'êtes pas autorisé à modifier cette ressource'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification propriété:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur de vérification des permissions'
      });
    }
  };
};

module.exports = { 
  authMiddleware, 
  requireRole, 
  requireOwnershipOrAdmin 
};