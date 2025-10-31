const { Pool } = require('pg');

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'votre_utilisateur',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'plateforme_commune_sn',
  password: process.env.DB_PASSWORD || 'votre_mot_de_passe',
  port: process.env.DB_PORT || 5432,
});

// Récupérer toutes les communes
const getAllCommunes = async (req, res) => {
  try {
    console.log('Récupération de toutes les communes');
    
    const query = `
      SELECT 
        id,
        nom,
        region,
        departement,
        latitude,
        longitude
      FROM communes 
      ORDER BY nom
    `;

    const result = await pool.query(query);
    
    // Valider et parser les coordonnées
    const communes = result.rows.map(commune => ({
      ...commune,
      latitude: parseFloat(commune.latitude) || 14.7167,
      longitude: parseFloat(commune.longitude) || -17.4677
    }));

    console.log(`✅ ${communes.length} communes récupérées`);
    
    res.status(200).json({
      success: true,
      data: communes,
      count: communes.length
    });
  } catch (error) {
    console.error('❌ Erreur base de données:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des communes',
      error: error.message 
    });
  }
};

// Récupérer les contours d'une commune spécifique
const getCommuneContours = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🗺️ Récupération des contours pour la commune ID: ${id}`);
    
    const query = `
      SELECT 
        id,
        nom,
        region,
        departement,
        latitude,
        longitude,
        ST_AsGeoJSON(geom) as geometrie
      FROM communes 
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Commune non trouvée' 
      });
    }

    const commune = result.rows[0];
    
    console.log(`✅ Commune trouvée: ${commune.nom}`);
    
    // Convertir la string GeoJSON en objet JSON
    let geometrie;
    try {
      geometrie = JSON.parse(commune.geometrie);
    } catch (error) {
      console.log('ℹ️ La géométrie est déjà un objet JSON ou autre format');
      geometrie = commune.geometrie;
    }

    // S'assurer que latitude et longitude sont des nombres valides
    const latitude = parseFloat(commune.latitude);
    const longitude = parseFloat(commune.longitude);

    const responseData = {
      success: true,
      data: {
        id: commune.id,
        nom: commune.nom,
        region: commune.region,
        departement: commune.departement,
        latitude: isNaN(latitude) ? 14.7167 : latitude,
        longitude: isNaN(longitude) ? -17.4677 : longitude,
        geometrie: geometrie
      }
    };

    console.log(`📊 Données renvoyées pour ${commune.nom}:`, {
      latitude: responseData.data.latitude,
      longitude: responseData.data.longitude,
      hasGeometrie: !!responseData.data.geometrie
    });

    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Erreur base de données:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des contours',
      error: error.message 
    });
  }
};

// Rechercher des communes par nom
const searchCommunes = async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Le terme de recherche doit contenir au moins 2 caractères'
    });
  }

  try {
    console.log(`🔍 Recherche de communes avec: "${q}"`);
    
    const query = `
      SELECT 
        id,
        nom,
        region,
        departement,
        latitude,
        longitude
      FROM communes 
      WHERE nom ILIKE $1 OR region ILIKE $1
      ORDER BY 
        CASE 
          WHEN nom ILIKE $1 THEN 1
          WHEN region ILIKE $1 THEN 2
          ELSE 3
        END,
        nom
      LIMIT 10
    `;

    const result = await pool.query(query, [`%${q}%`]);
    
    // Valider et parser les coordonnées
    const communes = result.rows.map(commune => ({
      ...commune,
      latitude: parseFloat(commune.latitude) || 14.7167,
      longitude: parseFloat(commune.longitude) || -17.4677
    }));

    console.log(`✅ ${communes.length} communes trouvées pour "${q}"`);
    
    res.status(200).json({
      success: true,
      data: communes,
      count: communes.length
    });
  } catch (error) {
    console.error('❌ Erreur recherche communes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la recherche',
      error: error.message 
    });
  }
};

module.exports = {
  getAllCommunes,
  getCommuneContours,
  searchCommunes
};