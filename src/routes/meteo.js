const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Cache simple en mémoire (à remplacer par Redis en production)
const meteoCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// 🌤️ Données météo actuelles par commune
router.get('/actuelle/:commune', authMiddleware, async (req, res) => {
  try {
    const { commune } = req.params;
    
    // Vérifier le cache
    const cacheKey = `meteo_${commune}`;
    const cached = meteoCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Données météo servies depuis le cache');
      return res.json(cached.data);
    }

    console.log(`🌤️ Récupération météo pour: ${commune}`);
    
    // Coordonnées des principales communes (à étendre)
    const coordonneesCommunes = {
      'Dakar': { lat: 14.7167, lon: -17.4677 },
      'Pikine': { lat: 14.75, lon: -17.4 },
      'Guédiawaye': { lat: 14.7833, lon: -17.4 },
      'Rufisque': { lat: 14.7167, lon: -17.2667 },
      'Thiès': { lat: 14.8, lon: -16.9333 },
      'Saint-Louis': { lat: 16.0333, lon: -16.5 },
      'Kaolack': { lat: 14.15, lon: -16.0833 },
      'Ziguinchor': { lat: 12.5833, lon: -16.2667 }
    };

    const coords = coordonneesCommunes[commune] || coordonneesCommunes['Dakar'];
    
    // Appel à l'API OpenMeteo (gratuit)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum&timezone=Africa%2FDakar`
    );

    if (!response.ok) {
      throw new Error(`Erreur API météo: ${response.status}`);
    }

    const data = await response.json();
    
    // Formater les données
    const meteoFormatee = {
      commune: commune,
      actuelle: {
        temperature: Math.round(data.current.temperature_2m),
        humidite: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        pluie: data.current.rain,
        code_meteo: data.current.weather_code,
        vent: data.current.wind_speed_10m,
        condition: getConditionMeteo(data.current.weather_code),
        icone: getIconeMeteo(data.current.weather_code),
        date: new Date().toISOString()
      },
      previsions: data.daily.time.map((date, index) => ({
        date: date,
        temp_max: Math.round(data.daily.temperature_2m_max[index]),
        temp_min: Math.round(data.daily.temperature_2m_min[index]),
        precipitation: data.daily.precipitation_sum[index],
        pluie: data.daily.rain_sum[index],
        code_meteo: data.daily.weather_code[index],
        condition: getConditionMeteo(data.daily.weather_code[index]),
        icone: getIconeMeteo(data.daily.weather_code[index])
      })).slice(0, 5), // 5 jours de prévision
      alertes: genererAlertesMeteo(data.current, commune)
    };

    // Mettre en cache
    meteoCache.set(cacheKey, {
      data: {
        success: true,
        data: meteoFormatee,
        source: 'OpenMeteo',
        last_updated: new Date().toISOString()
      },
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: meteoFormatee,
      source: 'OpenMeteo',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur route météo:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données météo: ' + error.message
    });
  }
});

// 🔔 Alertes météo pour les projets
router.get('/alertes/:commune', authMiddleware, async (req, res) => {
  try {
    const { commune } = req.params;
    
    // Récupérer données météo actuelles
    const response = await fetch(`http://localhost:5000/api/meteo/actuelle/${commune}`, {
      headers: { 'Authorization': req.headers.authorization }
    });
    
    if (!response.ok) {
      throw new Error('Erreur récupération météo');
    }

    const meteoData = await response.json();
    
    if (!meteoData.success) {
      throw new Error(meteoData.error);
    }

    const alertes = analyserImpactProjets(meteoData.data, commune);
    
    res.json({
      success: true,
      data: alertes,
      count: alertes.length
    });

  } catch (error) {
    console.error('❌ Erreur alertes météo:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des alertes'
    });
  }
});

// Fonctions utilitaires
function getConditionMeteo(code) {
  const conditions = {
    0: 'Ensoleillé', 1: 'Principalement clair', 2: 'Partiellement nuageux',
    3: 'Couvert', 45: 'Brouillard', 48: 'Brouillard givrant',
    51: 'Bruine légère', 53: 'Bruine modérée', 55: 'Bruine dense',
    61: 'Pluie légère', 63: 'Pluie modérée', 65: 'Pluie forte',
    80: 'Averses légères', 81: 'Averses modérées', 82: 'Averses violentes',
    95: 'Orage léger', 96: 'Orage avec grêle', 99: 'Orage violent avec grêle'
  };
  return conditions[code] || 'Inconnu';
}

function getIconeMeteo(code) {
  const icones = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
    80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
  };
  return icones[code] || '❓';
}

function genererAlertesMeteo(meteoActuelle, commune) {
  const alertes = [];
  
  // Alerte pluie forte
  if (meteoActuelle.pluie > 10) {
    alertes.push({
      niveau: 'danger',
      type: 'pluie',
      message: `Pluie forte détectée à ${commune} (${meteoActuelle.pluie}mm)`,
      impact: 'Risque d\'inondation pour les projets en extérieur',
      actions: ['Reporter les travaux extérieurs', 'Vérifier le drainage']
    });
  }
  
  // Alerte vent fort
  if (meteoActuelle.vent > 25) {
    alertes.push({
      niveau: 'warning',
      type: 'vent',
      message: `Vent fort à ${commune} (${meteoActuelle.vent} km/h)`,
      impact: 'Risque pour les installations temporaires',
      actions: ['Sécuriser les équipements', 'Surveiller les structures légères']
    });
  }
  
  // Alerte chaleur
  if (meteoActuelle.temperature > 35) {
    alertes.push({
      niveau: 'warning', 
      type: 'chaleur',
      message: `Forte chaleur à ${commune} (${meteoActuelle.temperature}°C)`,
      impact: 'Risque pour les travaux en extérieur',
      actions: ['Augmenter les pauses', 'Fournir de l\'eau']
    });
  }

  return alertes;
}

function analyserImpactProjets(meteoData, commune) {
  const impacts = [];
  const { actuelle, previsions } = meteoData;
  
  // Impact sur les ressources agricoles
  if (actuelle.pluie > 5) {
    impacts.push({
      type_ressource: 'Agricole',
      impact: actuelle.pluie > 15 ? 'Négatif' : 'Positif',
      message: actuelle.pluie > 15 
        ? `Pluie excessive (${actuelle.pluie}mm) - Risque pour les cultures`
        : `Pluie bénéfique (${actuelle.pluie}mm) - Bon pour l'irrigation`,
      recommandation: actuelle.pluie > 15 
        ? 'Surveiller le drainage des champs'
        : 'Profiter pour les semis'
    });
  }
  
  // Impact sur les ressources hydriques
  if (previsions.some(j => j.precipitation > 0)) {
    const pluieTotale = previsions.reduce((sum, j) => sum + j.precipitation, 0);
    impacts.push({
      type_ressource: 'Hydrique',
      impact: 'Positif',
      message: `Prévisions de pluie (${pluieTotale.toFixed(1)}mm sur 5 jours)`,
      recommandation: 'Recharge des nappes phréatiques attendue'
    });
  }
  
  return impacts;
}

module.exports = router;