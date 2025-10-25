const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Route pour lister tous les utilisateurs - Admin seulement
router.get('/utilisateurs', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nom, email, role, commune_id, telephone, actif, created_at FROM utilisateurs ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// Route pour modifier un utilisateur - Admin seulement
router.put('/utilisateurs/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, actif } = req.body;
    
    const result = await db.query(
      'UPDATE utilisateurs SET role = $1, actif = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, nom, email, role, actif',
      [role, actif, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Utilisateur modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de l\'utilisateur'
    });
  }
});

// Route pour les statistiques - Admin seulement
router.get('/statistiques', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_ressources,
        COUNT(DISTINCT created_by) as total_contributeurs,
        COUNT(DISTINCT commune_id) as communes_couvertes
      FROM ressources
    `);
    
    const typesResult = await db.query(`
      SELECT t.type, COUNT(r.id) as count
      FROM types_ressources t
      LEFT JOIN ressources r ON t.id = r.type_ressource_id
      GROUP BY t.id, t.type
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: {
        general: statsResult.rows[0],
        parType: typesResult.rows
      }
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;