const express = require('express');
const router = express.Router();
const {
  getStatistiquesCommunes,
  getTendancesTemporelles,
  getAnalyseParType,
  getIndicateursPerformance,
  getDonneesCarteThematique
} = require('../controllers/statistiques');
const { authMiddleware } = require('../middleware/auth');

// 🔐 Toutes les routes nécessitent une authentification
// (mais sont accessibles à tous les rôles connectés)

// 🏆 Statistiques comparatives par commune
router.get('/communes', authMiddleware, getStatistiquesCommunes);

// 📈 Tendances temporelles (12 derniers mois)
router.get('/tendances', authMiddleware, getTendancesTemporelles);

// 🔍 Analyse détaillée par type de ressource
router.get('/types', authMiddleware, getAnalyseParType);

// 🎯 Indicateurs de performance globaux (KPIs)
router.get('/indicateurs', authMiddleware, getIndicateursPerformance);

// 🗺️ Données pour la carte thématique
router.get('/carte-thematique', authMiddleware, getDonneesCarteThematique);

module.exports = router;