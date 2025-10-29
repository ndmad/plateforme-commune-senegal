const db = require('../config/database');

// 🏆 STATISTIQUES PAR COMMUNE - Analyse comparative
const getStatistiquesCommunes = async (req, res) => {
  try {
    console.log('📊 Calcul des statistiques par commune...');
    
    const query = `
      SELECT 
        c.id,
        c.nom as commune,
        COUNT(r.id) as total_ressources,
        COUNT(CASE WHEN r.potentiel = 'élevé' THEN 1 END) as ressources_haut_potentiel,
        COUNT(CASE WHEN r.potentiel = 'moyen' THEN 1 END) as ressources_potentiel_moyen,
        COUNT(CASE WHEN r.potentiel = 'faible' THEN 1 END) as ressources_potentiel_faible,
        COUNT(CASE WHEN r.etat_utilisation = 'optimisé' THEN 1 END) as ressources_optimisees,
        COUNT(CASE WHEN r.etat_utilisation = 'sous-utilisé' THEN 1 END) as ressources_sous_utilisees,
        COUNT(CASE WHEN r.etat_utilisation = 'inexploité' THEN 1 END) as ressources_inexploitees,
        ROUND(
          (COUNT(CASE WHEN r.potentiel = 'élevé' THEN 1 END) * 1.0 / NULLIF(COUNT(r.id), 0)) * 100, 
          2
        ) as pourcentage_haut_potentiel,
        ROUND(
          (COUNT(CASE WHEN r.etat_utilisation = 'optimisé' THEN 1 END) * 1.0 / NULLIF(COUNT(r.id), 0)) * 100, 
          2
        ) as pourcentage_optimise,
        -- Score composite pour le classement
        (
          (COUNT(r.id) * 0.3) + 
          (COUNT(CASE WHEN r.potentiel = 'élevé' THEN 1 END) * 0.5) +
          (COUNT(CASE WHEN r.etat_utilisation = 'optimisé' THEN 1 END) * 0.2)
        ) as score_global
      FROM communes c
      LEFT JOIN ressources r ON c.id = r.commune_id
      GROUP BY c.id, c.nom
      ORDER BY score_global DESC, total_ressources DESC
    `;
    
    const result = await db.query(query);
    
    console.log(`✅ ${result.rowCount} communes analysées`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      message: `Statistiques calculées pour ${result.rowCount} communes`
    });
    
  } catch (error) {
    console.error('❌ Erreur statistiques communes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques par commune: ' + error.message
    });
  }
};

// 📈 TENDANCES TEMPORELLES - Évolution dans le temps
const getTendancesTemporelles = async (req, res) => {
  try {
    console.log('📈 Calcul des tendances temporelles...');
    
    const query = `
      SELECT 
        DATE_TRUNC('month', created_at) as mois,
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mois_format,
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as mois_affichage,
        COUNT(*) as nouvelles_ressources,
        COUNT(CASE WHEN potentiel = 'élevé' THEN 1 END) as ressources_haut_potentiel,
        COUNT(CASE WHEN etat_utilisation = 'optimisé' THEN 1 END) as ressources_optimisees,
        ROUND(
          (COUNT(CASE WHEN potentiel = 'élevé' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
          2
        ) as taux_haut_potentiel
      FROM ressources 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY mois ASC
    `;
    
    const result = await db.query(query);
    
    console.log(`✅ ${result.rowCount} mois analysés`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      periode: '12 derniers mois'
    });
    
  } catch (error) {
    console.error('❌ Erreur tendances temporelles:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des tendances: ' + error.message
    });
  }
};

// 🔍 ANALYSE PAR TYPE DE RESSOURCE - Répartition détaillée
const getAnalyseParType = async (req, res) => {
  try {
    console.log('🔍 Analyse par type de ressource...');
    
    const query = `
      SELECT 
        COALESCE(t.type, 'Non spécifié') as type_ressource,
        t.categorie,
        t.icone,
        t.couleur,
        COUNT(r.id) as total,
        COUNT(CASE WHEN r.potentiel = 'élevé' THEN 1 END) as haut_potentiel,
        COUNT(CASE WHEN r.potentiel = 'moyen' THEN 1 END) as potentiel_moyen,
        COUNT(CASE WHEN r.potentiel = 'faible' THEN 1 END) as potentiel_faible,
        COUNT(CASE WHEN r.etat_utilisation = 'optimisé' THEN 1 END) as optimise,
        COUNT(CASE WHEN r.etat_utilisation = 'sous-utilisé' THEN 1 END) as sous_utilise,
        COUNT(CASE WHEN r.etat_utilisation = 'inexploité' THEN 1 END) as inexploite,
        ROUND(
          (COUNT(CASE WHEN r.potentiel = 'élevé' THEN 1 END) * 100.0 / NULLIF(COUNT(r.id), 0)), 
          2
        ) as pourcentage_haut_potentiel,
        ROUND(AVG(
          CASE 
            WHEN r.potentiel = 'élevé' THEN 3
            WHEN r.potentiel = 'moyen' THEN 2
            WHEN r.potentiel = 'faible' THEN 1
            ELSE 0
          END
        ), 2) as score_potentiel_moyen
      FROM types_ressources t
      LEFT JOIN ressources r ON t.id = r.type_ressource_id
      GROUP BY t.id, t.type, t.categorie, t.icone, t.couleur
      ORDER BY total DESC, score_potentiel_moyen DESC
    `;
    
    const result = await db.query(query);
    
    console.log(`✅ ${result.rowCount} types de ressources analysés`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
  } catch (error) {
    console.error('❌ Erreur analyse par type:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse par type: ' + error.message
    });
  }
};

// 🎯 INDICATEURS DE PERFORMANCE - KPIs globaux
const getIndicateursPerformance = async (req, res) => {
  try {
    console.log('🎯 Calcul des indicateurs de performance...');
    
    const query = `
      SELECT 
        -- Totaux
        COUNT(*) as total_ressources,
        COUNT(DISTINCT commune_id) as communes_couvertes,
        COUNT(DISTINCT created_by) as contributeurs_actifs,
        
        -- Potentiel
        COUNT(CASE WHEN potentiel = 'élevé' THEN 1 END) as ressources_haut_potentiel,
        COUNT(CASE WHEN potentiel = 'moyen' THEN 1 END) as ressources_potentiel_moyen,
        COUNT(CASE WHEN potentiel = 'faible' THEN 1 END) as ressources_potentiel_faible,
        ROUND(
          (COUNT(CASE WHEN potentiel = 'élevé' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
          2
        ) as taux_haut_potentiel,
        
        -- Utilisation
        COUNT(CASE WHEN etat_utilisation = 'optimisé' THEN 1 END) as ressources_optimisees,
        COUNT(CASE WHEN etat_utilisation = 'sous-utilisé' THEN 1 END) as ressources_sous_utilisees,
        COUNT(CASE WHEN etat_utilisation = 'inexploité' THEN 1 END) as ressources_inexploitees,
        ROUND(
          (COUNT(CASE WHEN etat_utilisation = 'optimisé' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
          2
        ) as taux_optimisation,
        
        -- Activité récente
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as nouvelles_30_jours,
        COUNT(CASE WHEN updated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as modifications_30_jours,
        
        -- Score global de la plateforme
        ROUND((
          (COUNT(CASE WHEN potentiel = 'élevé' THEN 1 END) * 0.4) +
          (COUNT(CASE WHEN etat_utilisation = 'optimisé' THEN 1 END) * 0.3) +
          (COUNT(DISTINCT commune_id) * 0.2) +
          (COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) * 0.1)
        ), 2) as score_plateforme
        
      FROM ressources
      WHERE commune_id IS NOT NULL
    `;
    
    const result = await db.query(query);
    
    console.log('✅ Indicateurs de performance calculés');
    
    res.json({
      success: true,
      data: result.rows[0] || {},
      message: 'Indicateurs de performance calculés avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur indicateurs performance:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des indicateurs: ' + error.message
    });
  }
};

// 🗺️ DONNÉES POUR CARTE THÉMATIQUE - Géolocalisation
const getDonneesCarteThematique = async (req, res) => {
  try {
    console.log('🗺️ Préparation des données pour carte thématique...');
    
    const query = `
      SELECT 
        c.id,
        c.nom as commune,
        c.latitude,
        c.longitude,
        COUNT(r.id) as total_ressources,
        COUNT(CASE WHEN r.potentiel = 'élevé' THEN 1 END) as ressources_haut_potentiel,
        COUNT(CASE WHEN r.etat_utilisation = 'optimisé' THEN 1 END) as ressources_optimisees,
        COALESCE(c.latitude, 0) as lat,
        COALESCE(c.longitude, 0) as lng,
        -- Densité calculée
        CASE 
          WHEN COUNT(r.id) = 0 THEN 0
          WHEN COUNT(r.id) <= 5 THEN 1
          WHEN COUNT(r.id) <= 15 THEN 2
          ELSE 3
        END as niveau_densite
      FROM communes c
      LEFT JOIN ressources r ON c.id = r.commune_id
      GROUP BY c.id, c.nom, c.latitude, c.longitude
      HAVING COUNT(r.id) > 0 OR c.latitude IS NOT NULL
      ORDER BY total_ressources DESC
    `;
    
    const result = await db.query(query);
    
    console.log(`✅ ${result.rowCount} communes préparées pour la carte`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
  } catch (error) {
    console.error('❌ Erreur données carte thématique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la préparation des données cartographiques: ' + error.message
    });
  }
};

module.exports = {
  getStatistiquesCommunes,
  getTendancesTemporelles,
  getAnalyseParType,
  getIndicateursPerformance,
  getDonneesCarteThematique
};