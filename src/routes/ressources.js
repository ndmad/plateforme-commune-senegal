const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Route GET pour récupérer toutes les ressources
// Route GET pour récupérer toutes les ressources
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

// Route POST pour ajouter une ressource
router.post('/', async (req, res) => {
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
    
    console.log('Données reçues:', req.body);
    
    const query = `
      INSERT INTO ressources (
        nom, type_ressource_id, description, localisation, 
        commune_id, potentiel, etat_utilisation, contact_nom, contact_tel
      ) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10)
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
      contact_tel
    ]);
    
    console.log('Ressource ajoutée:', result.rows[0]);
    
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

// Route GET pour une ressource spécifique
// Route GET pour une ressource spécifique
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