const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Données démographiques par commune
router.get('/demographie/:commune', authMiddleware, async (req, res) => {
  try {
    const { commune } = req.params;
    
    // Données simulées basées sur RGPHAE 2023
    const populationData = {
      'Dakar': { total: 1146053, density: 15739, growth: 2.8 },
      'Pikine': { total: 1255756, density: 12453, growth: 3.1 },
      'Guediawaye': { total: 382277, density: 25896, growth: 2.9 },
      'Rufisque': { total: 630609, density: 2845, growth: 2.7 }
    };

    const data = {
      population: populationData[commune] || { total: 0, density: 0, growth: 0 },
      menages: {
        total_menages: Math.floor(Math.random() * 50000) + 10000,
        taille_moyenne: (Math.random() * 2 + 6).toFixed(1),
        taux_equipement: Math.floor(Math.random() * 40) + 50
      },
      pyramide_ages: {
        '0-14': Math.floor(Math.random() * 10) + 40,
        '15-24': Math.floor(Math.random() * 10) + 20,
        '25-59': Math.floor(Math.random() * 10) + 35,
        '60+': Math.floor(Math.random() * 5) + 5
      }
    };
    
    res.json({
      success: true,
      data,
      source: 'ANSD - RGPHAE 2023',
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur route démographie:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données démographiques'
    });
  }
});

// Données économiques
router.get('/economie/:commune', authMiddleware, async (req, res) => {
  try {
    const { commune } = req.params;
    
    const data = {
      taux_chomage: (Math.random() * 10 + 10).toFixed(1),
      revenu_moyen: Math.floor(Math.random() * 50000) + 50000,
      secteur_primaire: (Math.random() * 20 + 5).toFixed(1),
      secteur_secondaire: (Math.random() * 25 + 15).toFixed(1),
      secteur_tertiaire: (Math.random() * 40 + 50).toFixed(1)
    };
    
    res.json({
      success: true,
      data,
      source: 'ANSD - Enquête Emploi',
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur route économie:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données économiques'
    });
  }
});

// Indicateurs de développement
router.get('/indicateurs/:commune', authMiddleware, async (req, res) => {
  try {
    const { commune } = req.params;
    
    const data = {
      idh: (Math.random() * 0.2 + 0.5).toFixed(3),
      pauvreté: (Math.random() * 20 + 20).toFixed(1),
      scolarisation: (Math.random() * 20 + 70).toFixed(1),
      acces_eau: (Math.random() * 20 + 70).toFixed(1),
      acces_electricite: (Math.random() * 20 + 75).toFixed(1)
    };

    res.json({
      success: true,
      data,
      source: 'ANSD - Indicateurs de Développement',
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur route indicateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des indicateurs'
    });
  }
});

// Statistiques globales
router.get('/statistiques-globales', authMiddleware, async (req, res) => {
  try {
    const communes = ['Dakar', 'Pikine', 'Guediawaye', 'Rufisque'];
    const globalStats = {};

    for (const commune of communes) {
      globalStats[commune] = {
        demographic: {
          population: {
            total: Math.floor(Math.random() * 1000000) + 300000,
            density: Math.floor(Math.random() * 20000) + 5000,
            growth: (Math.random() * 2 + 2.5).toFixed(1)
          },
          menages: {
            total_menages: Math.floor(Math.random() * 50000) + 10000,
            taille_moyenne: (Math.random() * 2 + 6).toFixed(1)
          }
        },
        economic: {
          taux_chomage: (Math.random() * 10 + 10).toFixed(1),
          revenu_moyen: Math.floor(Math.random() * 50000) + 50000
        },
        indicateurs: {
          idh: (Math.random() * 0.2 + 0.5).toFixed(3),
          pauvreté: (Math.random() * 20 + 20).toFixed(1)
        }
      };
    }

    res.json({
      success: true,
      data: globalStats,
      source: 'ANSD - Statistiques Régionales',
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur route statistiques globales:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques globales'
    });
  }
});

module.exports = router;