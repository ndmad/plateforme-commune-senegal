const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.HUGGINGFACE_API_KEY;
    this.baseURL = process.env.AI_API_URL || 'https://api.openai.com/v1';
  }

  // Analyse des patterns et recommandations
  async analyzePatterns(ressources, communeData) {
    try {
      const prompt = this.createAnalysisPrompt(ressources, communeData);
      const response = await this.callAIAPI(prompt);
      
      return {
        patterns: this.extractPatterns(response),
        recommendations: this.extractRecommendations(response),
        predictions: this.extractPredictions(response),
        riskAreas: this.extractRiskAreas(response)
      };
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      return this.getFallbackAnalysis(ressources);
    }
  }

  // Classification automatique des ressources
  async classifyRessource(ressourceData) {
    const prompt = `
      Classifie cette ressource communale selon ces catégories: 
      Agricole, Hydrique, Commerciale, Artisanale, Touristique, Minérale, Énergétique, Forestière.
      
      Ressource: ${ressourceData.nom}
      Description: ${ressourceData.description}
      Localisation: ${ressourceData.localisation}
      
      Réponds uniquement avec la catégorie la plus pertinente.
    `;

    try {
      const response = await this.callAIAPI(prompt);
      return this.cleanClassification(response);
    } catch (error) {
      return this.predictCategoryFromData(ressourceData);
    }
  }

  // Détection d'anomalies
  async detectAnomalies(ressources) {
    const anomalies = [];
    
    // Analyse statistique simple
    const stats = this.calculateStats(ressources);
    
    ressources.forEach(ressource => {
      if (this.isAnomaly(ressource, stats)) {
        anomalies.push({
          ressource: ressource.nom,
          type: 'anomalie_detection',
          score: this.calculateAnomalyScore(ressource, stats),
          message: this.generateAnomalyMessage(ressource, stats)
        });
      }
    });

    return anomalies;
  }

  // Prévisions de développement
  async predictDevelopment(communeData, historicalData) {
    const prompt = this.createPredictionPrompt(communeData, historicalData);
    
    try {
      const response = await this.callAIAPI(prompt);
      return this.parsePredictionResponse(response);
    } catch (error) {
      return this.basicTrendAnalysis(communeData, historicalData);
    }
  }

  // Chatbot d'assistance
  async chatAssistance(message, context) {
    const prompt = this.createChatPrompt(message, context);
    
    try {
      const response = await this.callAIAPI(prompt, { max_tokens: 500 });
      return {
        response: response.choices[0].text.trim(),
        suggestions: this.extractSuggestions(response),
        sources: this.extractSources(context)
      };
    } catch (error) {
      return {
        response: "Je rencontre des difficultés techniques. Pouvez-vous reformuler votre question?",
        suggestions: ['Contactez le support', 'Consultez la documentation'],
        sources: []
      };
    }
  }

  // Méthodes utilitaires
  createAnalysisPrompt(ressources, communeData) {
    return `
      En tant qu'expert en développement communal, analyse ces ressources:
      
      Commune: ${communeData.nom}
      Population: ${communeData.population}
      Superficie: ${communeData.superficie_km2} km²
      
      Ressources disponibles (${ressources.length}):
      ${ressources.map(r => `- ${r.nom} (${r.type}): ${r.potentiel}`).join('\n')}
      
      Donne:
      1. 3 patterns principaux observés
      2. 5 recommandations de développement
      3. Prévisions à 5 ans
      4. Zones à risque
      
      Format JSON structuré.
    `;
  }

  async callAIAPI(prompt, options = {}) {
    // Support pour OpenAI et HuggingFace
    if (process.env.OPENAI_API_KEY) {
      return this.callOpenAI(prompt, options);
    } else if (process.env.HUGGINGFACE_API_KEY) {
      return this.callHuggingFace(prompt, options);
    } else {
      // Fallback local
      return this.localAIFallback(prompt);
    }
  }

  async callOpenAI(prompt, options) {
    const response = await axios.post(`${this.baseURL}/chat/completions`, {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.max_tokens || 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  // Méthodes de fallback pour développement sans API
  localAIFallback(prompt) {
    // Logique de fallback basique
    return {
      choices: [{
        text: JSON.stringify({
          patterns: ["Distribution équilibrée des ressources", "Potentiel touristique sous-exploité"],
          recommendations: [
            "Développer l'écotourisme",
            "Optimiser l'utilisation des ressources hydriques",
            "Renforcer les infrastructures commerciales"
          ],
          predictions: {
            "1_an": "Croissance modérée du secteur touristique",
            "5_ans": "Diversification économique significative"
          },
          risk_areas: ["Sécheresse saisonnière", "Déficit infrastructurel"]
        })
      }]
    };
  }

  getFallbackAnalysis(ressources) {
    return {
      patterns: ["Analyse basique - API non disponible"],
      recommendations: [
        "Consolider les données existantes",
        "Diversifier les sources de revenus",
        "Améliorer les infrastructures de base"
      ],
      predictions: {
        short_term: "Stabilité avec croissance modérée",
        long_term: "Potentiel de développement important"
      },
      risk_areas: ["Dépendance aux ressources principales"]
    };
  }
}

module.exports = new AIService();