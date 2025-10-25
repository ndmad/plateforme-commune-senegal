const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth'); // ← NOUVEAU

// Route GET pour récupérer toutes les ressources (reste publique)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.*, 
        t.categorie, 
        t.type, 
        t.icone, 
        t.couleur,
        ST_AsGeoJSON(r.localisation) as localisation_geojson
      FROM ressources r 
      LEFT JOIN types_ressources t ON r.type_ressource_id = t.id
    `;
    const result = await db.query(query);
    
    // Convertir les données pour le frontend
    const ressourcesFormatees = result.rows.map(ressource => {
      let localisation = null;
      
      if (ressource.localisation_geojson) {
        try {
          const geojson = JSON.parse(ressource.localisation_geojson);
          localisation = {
            type: geojson.type,
            coordinates: geojson.coordinates
          };
        } catch (error) {
          console.error('Erreur parsing GeoJSON:', error);
        }
      }
      
      return {
        ...ressource,
        localisation: localisation
      };
    });
    
    res.json({
      success: true,
      data: ressourcesFormatees,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route POST pour ajouter une ressource ← MAINTENANT PROTÉGÉE
// Route POST pour ajouter une ressource ← MAINTENANT PROTÉGÉE
router.post('/', authMiddleware, async (req, res) => {
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
    
    console.log('Ajout ressource par utilisateur:', req.user.id);
    
    // REQUÊTE SQL CORRIGÉE - pas de commentaires dans le SQL
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
      req.user.id  // ID de l'utilisateur connecté
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

// Route PUT pour modifier une ressource ← NOUVELLE ROUTE PROTÉGÉE
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, potentiel, etat_utilisation } = req.body;
    
    // Vérifier que l'utilisateur peut modifier cette ressource
    const checkResult = await db.query(
      'SELECT created_by FROM ressources WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ressource non trouvée'
      });
    }
    
    // Seul le créateur ou un admin peut modifier
    if (checkResult.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à modifier cette ressource'
      });
    }
    
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

// Route DELETE pour supprimer une ressource ← NOUVELLE ROUTE PROTÉGÉE
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur peut supprimer cette ressource
    const checkResult = await db.query(
      'SELECT created_by FROM ressources WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ressource non trouvée'
      });
    }
    
    // Seul le créateur ou un admin peut supprimer
    if (checkResult.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à supprimer cette ressource'
      });
    }
    
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

// Route GET pour une ressource spécifique (reste publique)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        r.*, 
        t.categorie, 
        t.type, 
        t.icone, 
        t.couleur,
        ST_AsGeoJSON(r.localisation) as localisation_geojson
      FROM ressources r 
      LEFT JOIN types_ressources t ON r.type_ressource_id = t.id
      WHERE r.id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ressource non trouvée'
      });
    }
    
    // Convertir la localisation
    const ressource = result.rows[0];
    let localisation = null;
    
    if (ressource.localisation_geojson) {
      try {
        const geojson = JSON.parse(ressource.localisation_geojson);
        localisation = {
          type: geojson.type,
          coordinates: geojson.coordinates
        };
      } catch (error) {
        console.error('Erreur parsing GeoJSON:', error);
      }
    }
    
    res.json({
      success: true,
      data: {
        ...ressource,
        localisation: localisation
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;