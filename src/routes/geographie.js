const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 🗺️ Route pour récupérer les contours des communes depuis PostGIS
router.get('/communes/contours', async (req, res) => {
  try {
    console.log('🗺️ Récupération des contours des communes depuis PostGIS...');
    
    const query = `
      SELECT 
        id,
        nom,
        region,
        ST_AsGeoJSON(geom) as geometry,
        ST_X(ST_Centroid(geom)) as longitude,
        ST_Y(ST_Centroid(geom)) as latitude
      FROM communes 
      WHERE geom IS NOT NULL
      ORDER BY nom
    `;
    
    const result = await db.query(query);
    
    const communesAvecGeometrie = result.rows.map(commune => {
      let geometry = null;
      try {
        geometry = JSON.parse(commune.geometry);
      } catch (e) {
        console.error('❌ Erreur parsing GeoJSON pour', commune.nom, e);
      }
      
      return {
        id: commune.id,
        nom: commune.nom,
        region: commune.region,
        latitude: commune.latitude,
        longitude: commune.longitude,
        geometry: geometry
      };
    });
    
    console.log(`✅ ${communesAvecGeometrie.length} contours chargés depuis PostGIS`);
    
    res.json({
      success: true,
      data: communesAvecGeometrie,
      count: communesAvecGeometrie.length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération contours:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des contours: ' + error.message
    });
  }
});

// 🔍 Route pour l'analyse spatiale avancée avec PostGIS
router.get('/analyse/zones-blanches', async (req, res) => {
  try {
    console.log('🔍 Analyse spatiale des zones blanches avec PostGIS...');
    
    const query = `
      SELECT 
        c.id,
        c.nom,
        c.region,
        COUNT(r.id) as nb_ressources,
        ST_AsGeoJSON(c.geom) as geometry,
        CASE 
          WHEN COUNT(r.id) = 0 THEN 'CRITIQUE'
          WHEN COUNT(r.id) < 3 THEN 'PRIORITAIRE' 
          ELSE 'NORMAL'
        END as niveau_priorite
      FROM communes c
      LEFT JOIN ressources r ON ST_Within(
        ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326),
        c.geom
      )
      GROUP BY c.id, c.nom, c.region, c.geom
      HAVING COUNT(r.id) < 3
      ORDER BY niveau_priorite, nb_ressources ASC
    `;
    
    const result = await db.query(query);
    
    const zonesBlanches = result.rows.map(zone => {
      let geometry = null;
      try {
        geometry = JSON.parse(zone.geometry);
      } catch (e) {
        console.error('Erreur parsing GeoJSON:', e);
      }
      
      return {
        commune: zone.nom,
        ressourcesCount: parseInt(zone.nb_ressources),
        region: zone.region,
        niveau: zone.niveau_priorite,
        geometry: geometry
      };
    });
    
    console.log(`✅ ${zonesBlanches.length} zones blanches identifiées`);
    
    res.json({
      success: true,
      data: zonesBlanches,
      count: zonesBlanches.length
    });
    
  } catch (error) {
    console.error('❌ Erreur analyse zones blanches:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse spatiale: ' + error.message
    });
  }
});

module.exports = router;