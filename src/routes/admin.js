const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Route pour récupérer tous les utilisateurs (EXISTANTE)
router.get('/utilisateurs', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nom, email, role, commune_id, telephone, actif, created_at 
       FROM utilisateurs 
       ORDER BY created_at DESC`
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// ✅ NOUVELLE ROUTE POUR MODIFIER UN UTILISATEUR
// ✅ ROUTE CORRIGÉE POUR password_hash
router.put('/utilisateurs/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, actif, commune_id, nouveau_mot_de_passe } = req.body;

    console.log('📝 Modification utilisateur:', { id, role, actif, commune_id });

    // Vérifier si l'utilisateur existe
    const userCheck = await db.query(
      'SELECT id FROM utilisateurs WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Préparer la requête de mise à jour
    let query = 'UPDATE utilisateurs SET role = $1, actif = $2, commune_id = $3';
    let params = [role, actif, commune_id];
    let paramIndex = 4;

    // CORRECTION: utiliser password_hash au lieu de mot_de_passe
    if (nouveau_mot_de_passe && nouveau_mot_de_passe.length >= 6) {
      const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);
      query += `, password_hash = $${paramIndex}`;
      params.push(hashedPassword);
      paramIndex++;
    } else if (nouveau_mot_de_passe && nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    query += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING id, nom, email, role, commune_id, actif`;
    params.push(id);

    const result = await db.query(query, params);

    console.log('✅ Utilisateur modifié:', result.rows[0]);

    res.json({
      success: true,
      data: result.rows[0],
      message: nouveau_mot_de_passe ? 
        'Utilisateur et mot de passe modifiés avec succès' : 
        'Utilisateur modifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur modification utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de l\'utilisateur: ' + error.message
    });
  }
});

module.exports = router;