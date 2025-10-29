const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission, PERMISSIONS } = require('../middleware/auth');
const db = require('../config/database');

// Journal d'audit (admin seulement)
router.get('/audit-logs', authMiddleware, requirePermission(PERMISSIONS.ADMIN_ACCESS), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Version simplifiée - juste compter le total
    const result = await db.query(
      `SELECT al.*, u.nom as user_name 
       FROM audit_logs al 
       LEFT JOIN utilisateurs u ON al.user_id = u.id 
       ORDER BY al.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      }
    });

  } catch (error) {
    console.error('❌ Erreur audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des logs'
    });
  }
});

// Rapport de sécurité CORRIGÉ
router.get('/security-report', authMiddleware, requirePermission(PERMISSIONS.ADMIN_ACCESS), async (req, res) => {
  try {
    console.log('🔐 Génération rapport sécurité...');
    
    const report = {
      totalUsers: 0,
      activeUsers: 0,
      recentActivities: 0,
      failedLogins: 0,
      systemStatus: 'OK'
    };

    // 1. Total utilisateurs
    try {
      const usersResult = await db.query(
        `SELECT COUNT(*) as total FROM utilisateurs WHERE actif = true`
      );
      report.totalUsers = parseInt(usersResult.rows[0].total) || 0;
    } catch (e) {
      console.error('Erreur comptage utilisateurs:', e);
      report.totalUsers = 'Erreur';
    }

    // 2. Activités récentes (24h) - version simplifiée
    try {
      const activitiesResult = await db.query(
        `SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours'`
      );
      report.recentActivities = parseInt(activitiesResult.rows[0].count) || 0;
    } catch (e) {
      console.error('Erreur comptage activités:', e);
      report.recentActivities = 'Erreur';
    }

    // 3. Utilisateurs actifs (connectés récemment)
    try {
      const activeResult = await db.query(
        `SELECT COUNT(*) as count FROM utilisateurs WHERE last_login >= NOW() - INTERVAL '7 days' AND actif = true`
      );
      report.activeUsers = parseInt(activeResult.rows[0].count) || 0;
    } catch (e) {
      console.error('Erreur comptage actifs:', e);
      report.activeUsers = 'Erreur';
    }

    console.log('✅ Rapport sécurité généré:', report);
    
    res.json({
      success: true,
      data: report,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur rapport sécurité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport: ' + error.message
    });
  }
});

// Route de test simple
router.get('/test', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Route sécurité fonctionnelle',
    user: {
      id: req.user.id,
      nom: req.user.nom,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

module.exports = router;