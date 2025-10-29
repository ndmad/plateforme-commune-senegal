const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Rôles et permissions (AJOUT)
const ROLES = {
  ADMIN: 'admin',
  EDITEUR: 'editeur', 
  CONSULTANT: 'consultant',
  AGENT_COMMUNAL: 'agent_communal'
};

const PERMISSIONS = {
  RESSOURCE_CREATE: 'ressource:create',
  RESSOURCE_READ: 'ressource:read',
  RESSOURCE_UPDATE: 'ressource:update',
  RESSOURCE_DELETE: 'ressource:delete',
  RESSOURCE_UPDATE_ALL: 'ressource:update_all',
  USER_MANAGE: 'user:manage',
  USER_READ: 'user:read',
  STATS_READ: 'stats:read',
  STATS_READ_ALL: 'stats:read_all',
  ADMIN_ACCESS: 'admin:access'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.RESSOURCE_CREATE,
    PERMISSIONS.RESSOURCE_READ,
    PERMISSIONS.RESSOURCE_UPDATE_ALL,
    PERMISSIONS.RESSOURCE_DELETE,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.STATS_READ_ALL,
    PERMISSIONS.ADMIN_ACCESS
  ],
  [ROLES.EDITEUR]: [
    PERMISSIONS.RESSOURCE_CREATE,
    PERMISSIONS.RESSOURCE_READ,
    PERMISSIONS.RESSOURCE_UPDATE,
    PERMISSIONS.RESSOURCE_DELETE,
    PERMISSIONS.STATS_READ
  ],
  [ROLES.AGENT_COMMUNAL]: [
    PERMISSIONS.RESSOURCE_CREATE,
    PERMISSIONS.RESSOURCE_READ,
    PERMISSIONS.RESSOURCE_UPDATE,
    PERMISSIONS.STATS_READ
  ],
  [ROLES.CONSULTANT]: [
    PERMISSIONS.RESSOURCE_READ,
    PERMISSIONS.STATS_READ
  ]
};

// Middleware existant (GARDER)
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

    // AJOUT: Ajouter les permissions basées sur le rôle
    req.user = {
      ...user,
      permissions: ROLE_PERMISSIONS[user.role] || []
    };
    
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

// Middleware existant (GARDER)
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

// Middleware existant (GARDER)
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

// NOUVEAU: Middleware de permission granulaire (AJOUT)
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

module.exports = { 
  authMiddleware, 
  requireRole, 
  requireOwnershipOrAdmin,
  requirePermission, // AJOUT
  ROLES, // AJOUT
  PERMISSIONS // AJOUT
};