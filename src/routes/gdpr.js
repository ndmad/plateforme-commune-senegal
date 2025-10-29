const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission, PERMISSIONS } = require('../middleware/auth');
const gdprService = require('../services/gdprService');

// Export des données personnelles
router.get('/export-my-data', authMiddleware, async (req, res) => {
  try {
    const userData = await gdprService.exportUserData(req.user.id);
    
    res.json({
      success: true,
      data: userData,
      message: 'Données exportées avec succès'
    });
    
  } catch (error) {
    console.error('Erreur export données:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export des données'
    });
  }
});

// Demande de suppression des données
router.post('/delete-my-account', authMiddleware, async (req, res) => {
  try {
    await gdprService.deleteUserData(req.user.id);
    
    res.json({
      success: true,
      message: 'Votre compte et vos données ont été supprimés'
    });
    
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du compte'
    });
  }
});

// Anonymiser les données (admin seulement)
router.post('/anonymize-user/:userId', authMiddleware, requirePermission(PERMISSIONS.ADMIN_ACCESS), async (req, res) => {
  try {
    await gdprService.anonymizeUserData(req.params.userId);
    
    res.json({
      success: true,
      message: 'Données utilisateur anonymisées avec succès'
    });
    
  } catch (error) {
    console.error('Erreur anonymisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'anonymisation'
    });
  }
});

// Rapport de conformité (admin seulement)
router.get('/compliance-report', authMiddleware, requirePermission(PERMISSIONS.ADMIN_ACCESS), async (req, res) => {
  try {
    const report = await gdprService.checkDataCompliance();
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Erreur rapport conformité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport'
    });
  }
});

module.exports = router;