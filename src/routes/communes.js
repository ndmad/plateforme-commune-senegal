const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Route GET pour récupérer toutes les communes
// Route GET pour récupérer toutes les communes
router.get('/', async (req, res) => {
  try {
    console.log('📋 Récupération de toutes les communes');
    
    const query = `
      SELECT 
        id,
        nom,
        region,
        departement,
        population,
        superficie_km2,
        chef_lieu,
        ST_Y(ST_Centroid(geom)) as latitude,
        ST_X(ST_Centroid(geom)) as longitude
      FROM communes 
      ORDER BY nom
    `;

    const result = await db.query(query);
    
    console.log(`✅ ${result.rows.length} communes récupérées`);
    
    // Valider et parser les coordonnées
    const communes = result.rows.map(commune => ({
      ...commune,
      latitude: parseFloat(commune.latitude) || 14.7167,
      longitude: parseFloat(commune.longitude) || -17.4677
    }));

    res.json({
      success: true,
      data: communes,
      count: result.rowCount
    });
  } catch (error) {
    console.error('❌ Erreur récupération communes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// Route GET pour rechercher des communes
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    
    if (!term || term.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Le terme de recherche doit contenir au moins 2 caractères'
      });
    }

    console.log(`🔍 Recherche de communes avec: "${term}"`);
    
    const query = `
      SELECT 
        id,
        nom,
        region,
        departement,
        population,
        superficie_km2,
        chef_lieu,
        ST_Y(ST_Centroid(geom)) as latitude,
        ST_X(ST_Centroid(geom)) as longitude
      FROM communes 
      WHERE nom ILIKE $1 OR region ILIKE $1
      ORDER BY nom
      LIMIT 10
    `;

    const result = await db.query(query, [`%${term}%`]);
    
    console.log(`✅ ${result.rows.length} communes trouvées pour "${term}"`);
    
    // Valider et parser les coordonnées
    const communes = result.rows.map(commune => ({
      ...commune,
      latitude: parseFloat(commune.latitude) || 14.7167,
      longitude: parseFloat(commune.longitude) || -17.4677
    }));

    res.json({
      success: true,
      data: communes,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Erreur recherche communes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la recherche',
      details: error.message
    });
  }
});

// Route GET pour une commune spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Récupération commune ID: ${id}`);
    
    const result = await db.query('SELECT * FROM communes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Commune non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route GET pour les contours d'une commune spécifique
// Route GET pour les contours d'une commune spécifique
router.get('/:id/contours', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗺️ Récupération des contours pour la commune ID: ${id}`);
    
    // Vérifier d'abord si la colonne geom existe
    const checkQuery = `
      SELECT 
        id,
        nom,
        region,
        departement,
        population,
        superficie_km2,
        chef_lieu
      FROM communes 
      WHERE id = $1
    `;

    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Commune non trouvée'
      });
    }

    const commune = checkResult.rows[0];
    console.log(`✅ Commune trouvée: ${commune.nom}`);

    // Essayer de récupérer la géométrie
    try {
      const geomQuery = `
        SELECT 
          ST_AsGeoJSON(geom) as geometrie,
          ST_Y(ST_Centroid(geom)) as latitude,
          ST_X(ST_Centroid(geom)) as longitude
        FROM communes 
        WHERE id = $1
      `;

      const geomResult = await db.query(geomQuery, [id]);
      
      let geometrie = null;
      let latitude = 14.7167;
      let longitude = -17.4677;

      if (geomResult.rows.length > 0 && geomResult.rows[0].geometrie) {
        try {
          geometrie = JSON.parse(geomResult.rows[0].geometrie);
          latitude = parseFloat(geomResult.rows[0].latitude) || 14.7167;
          longitude = parseFloat(geomResult.rows[0].longitude) || -17.4677;
          console.log('✅ Géométrie récupérée avec coordonnées:', latitude, longitude);
        } catch (parseError) {
          console.log('ℹ️ Géométrie non analysable');
        }
      }

      const responseData = {
        ...commune,
        latitude: latitude,
        longitude: longitude,
        geometrie: geometrie
      };

      console.log('📊 Données renvoyées:', {
        nom: responseData.nom,
        latitude: responseData.latitude,
        longitude: responseData.longitude,
        hasGeometrie: !!responseData.geometrie
      });

      res.json({
        success: true,
        data: responseData
      });

    } catch (geomError) {
      console.log('❌ Erreur géométrie:', geomError.message);
      
      // Retourner la commune sans géométrie mais avec coordonnées par défaut
      const responseData = {
        ...commune,
        latitude: 14.7167,
        longitude: -17.4677,
        geometrie: null
      };

      res.json({
        success: true,
        data: responseData
      });
    }

  } catch (error) {
    console.error('❌ Erreur récupération contours:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des contours',
      details: error.message
    });
  }
});

// Route GET pour rechercher des communes
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    
    if (!term || term.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Le terme de recherche doit contenir au moins 2 caractères'
      });
    }

    console.log(`🔍 Recherche de communes avec: "${term}"`);
    
    // Requête de recherche simplifiée
    const query = `
      SELECT 
        id,
        nom,
        region,
        departement,
        population,
        superficie_km2,
        chef_lieu
      FROM communes 
      WHERE nom ILIKE $1 OR region ILIKE $1
      ORDER BY nom
      LIMIT 10
    `;

    const result = await db.query(query, [`%${term}%`]);
    
    console.log(`✅ ${result.rows.length} communes trouvées pour "${term}"`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Erreur recherche communes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la recherche',
      details: error.message
    });
  }
});

module.exports = router;