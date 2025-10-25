const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, requireRole, requireOwnershipOrAdmin } = require('../middleware/auth');

// Route GET pour récupérer toutes les ressources (publique)
router.get('/', async (req, res) => {
  // ... (le code existant reste le même)
});

// Route POST pour ajouter une ressource - Accessible aux éditeurs et admins
router.post('/', authMiddleware, requireRole(['editeur', 'admin']), async (req, res) => {
  try {
    const { 
      nom, 
      type_ressource_id, 
      description, 
      latitude, 
      longitude, 
      commune_id, 
      potentiel, 
      etat_utilisation, 
      contact_nom, 
      contact_tel 
    } = req.body;
    
    console.log(`Ajout ressource par ${req.user.role}:`, req.user.nom);
    
    const query = `
      INSERT INTO ressources (
        nom, type_ressource_id, description, localisation, 
        commune_id, potentiel, etat_utilisation, contact_nom, contact_tel,
        created_by
      ) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      nom, 
      type_ressource_id, 
      description, 
      longitude, 
      latitude, 
      commune_id,
      potentiel || 'moyen',
      etat_utilisation || 'sous-utilisé',
      contact_nom,
      contact_tel,
      req.user.id
    ]);
    
    console.log('Ressource ajoutée par:', req.user.nom);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Ressource ajoutée avec succès'
    });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout de la ressource: ' + error.message
    });
  }
});

// Route PUT pour modifier une ressource - Propriétaire ou admin
router.put('/:id', authMiddleware, requireOwnershipOrAdmin('ressources'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, potentiel, etat_utilisation } = req.body;
    
    const query = `
      UPDATE ressources 
      SET nom = $1, description = $2, potentiel = $3, etat_utilisation = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await db.query(query, [
      nom, description, potentiel, etat_utilisation, id
    ]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Ressource modifiée avec succès'
    });
  } catch (error) {
    console.error('Erreur modification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification'
    });
  }
});

// Route DELETE pour supprimer une ressource - Propriétaire ou admin
router.delete('/:id', authMiddleware, requireOwnershipOrAdmin('ressources'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM ressources WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Ressource supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
});

// Route GET pour une ressource spécifique (publique)
router.get('/:id', async (req, res) => {
  // ... (le code existant reste le même)
});

module.exports = router;