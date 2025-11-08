const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');
const auth = require('../middleware/auth');

// Analyse intelligente des ressources
router.post('/analyze-commune', auth, async (req, res) => {
  try {
    const { ressources, commune } = req.body;
    
    const analysis = await AIService.analyzePatterns(ressources, commune);
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur analyse IA',
      details: error.message
    });
  }
});

// Classification automatique
router.post('/classify-ressource', auth, async (req, res) => {
  try {
    const { ressource } = req.body;
    
    const category = await AIService.classifyRessource(ressource);
    
    res.json({
      success: true,
      category: category,
      confidence: 0.85 // Score de confiance simulé
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur classification'
    });
  }
});

// Détection d'anomalies
router.get('/detect-anomalies/:communeId', auth, async (req, res) => {
  try {
    const { communeId } = req.params;
    // Récupérer les ressources de la commune
    const ressources = await getRessourcesByCommune(communeId);
    
    const anomalies = await AIService.detectAnomalies(ressources);
    
    res.json({
      success: true,
      anomalies: anomalies,
      total: anomalies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur détection anomalies'
    });
  }
});

// Chatbot d'assistance
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    const response = await AIService.chatAssistance(message, context);
    
    res.json({
      success: true,
      response: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur chatbot'
    });
  }
});

// Prévisions de développement
router.post('/predict-development', auth, async (req, res) => {
  try {
    const { communeData, historicalData, horizon } = req.body;
    
    const predictions = await AIService.predictDevelopment(communeData, historicalData);
    
    res.json({
      success: true,
      predictions: predictions,
      horizon: horizon || '5_years'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur prédictions'
    });
  }
});

module.exports = router;