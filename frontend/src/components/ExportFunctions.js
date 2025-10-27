// ExportFunctions.js - Version CSV uniquement
// Les PDF seront implémentés plus tard

// Configuration
const APP_CONFIG = {
    name: 'Plateforme Communale Sénégalaise',
    version: '1.0'
  };
  
  // Fonction utilitaire pour sécuriser les strings
  const safeString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      // Essayer d'extraire une valeur utile des objets
      if (value.nom) return String(value.nom);
      if (value.name) return String(value.name);
      if (value.type) return String(value.type);
      return 'Donnée objet';
    }
    return String(value);
  };
  
  // Fonction d'export Excel/CSV principale
  export const exportToExcel = (ressources, filename = 'ressources-communales') => {
    try {
      console.log('🚀 Début export CSV avec données:', ressources);
  
      // Validation des données
      if (!ressources || !Array.isArray(ressources)) {
        throw new Error('Données invalides: ressources doit être un tableau');
      }
  
      if (ressources.length === 0) {
        throw new Error('Aucune donnée à exporter');
      }
  
      // Nettoyer les données
      const cleanedData = ressources.map(ressource => ({
        'ID': safeString(ressource.id),
        'Nom': safeString(ressource.nom),
        'Type': safeString(ressource.type),
        'Description': safeString(ressource.description),
        'Potentiel': safeString(ressource.potentiel),
        'État utilisation': safeString(ressource.etat_utilisation),
        'Contact': safeString(ressource.contact_nom),
        'Téléphone': safeString(ressource.contact_tel),
        'Commune': safeString(ressource.commune_id),
        'Latitude': safeString(ressource.latitude),
        'Longitude': safeString(ressource.longitude),
        'Date création': ressource.created_at ? new Date(ressource.created_at).toLocaleDateString('fr-FR') : '',
        'Dernière modification': ressource.updated_at ? new Date(ressource.updated_at).toLocaleDateString('fr-FR') : ''
      }));
  
      // Créer le contenu CSV
      const headers = Object.keys(cleanedData[0]).join(';');
      const rows = cleanedData.map(row => 
        Object.values(row).map(value => 
          `"${String(value).replace(/"/g, '""')}"`
        ).join(';')
      ).join('\n');
      
      const csvContent = `${headers}\n${rows}`;
  
      // Ajouter des métadonnées en commentaire
      const metadata = [
        `# ${APP_CONFIG.name}`,
        `# Export généré le: ${new Date().toLocaleDateString('fr-FR')}`,
        `# Total des ressources: ${ressources.length}`,
        `# Format: CSV UTF-8`,
        `#`,
        csvContent
      ].join('\n');
  
      // Créer et télécharger le fichier
      const blob = new Blob([metadata], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      console.log('✅ CSV généré avec succès!', {
        ressources: ressources.length,
        colonnes: Object.keys(cleanedData[0]).length
      });
  
      return true;
  
    } catch (error) {
      console.error('❌ Erreur génération CSV:', error);
      throw new Error(`Échec de l'export CSV: ${error.message}`);
    }
  };
  
  // Export des statistiques en CSV
  export const exportDashboardExcel = (stats, filename = 'statistiques-dashboard') => {
    try {
      console.log('📊 Export statistiques:', stats);
  
      if (!stats) {
        throw new Error('Aucune statistique disponible');
      }
  
      let csvContent = `# Statistiques - ${APP_CONFIG.name}\n`;
      csvContent += `# Export généré le: ${new Date().toLocaleDateString('fr-FR')}\n#\n`;
  
      // Statistiques générales
      if (stats.general) {
        csvContent += 'INDICATEURS GÉNÉRAUX\n';
        csvContent += 'Libellé;Valeur\n';
        csvContent += `Ressources totales;${stats.general.totalRessources || 0}\n`;
        csvContent += `Communes couvertes;${stats.general.totalCommunes || 0}\n`;
        csvContent += `Contributeurs;${stats.general.contributeurs || 0}\n`;
        csvContent += `Taux d'optimisation;${stats.general.tauxUtilisation || 0}%\n`;
        csvContent += '\n';
      }
  
      // Répartition par type
      if (stats.types && Object.keys(stats.types).length > 0) {
        csvContent += 'RÉPARTITION PAR TYPE\n';
        csvContent += 'Type;Nombre\n';
        Object.entries(stats.types).forEach(([type, count]) => {
          csvContent += `${safeString(type)};${count}\n`;
        });
        csvContent += '\n';
      }
  
      // Répartition par potentiel
      if (stats.potentiels && Object.keys(stats.potentiels).length > 0) {
        csvContent += 'RÉPARTITION PAR POTENTIEL\n';
        csvContent += 'Potentiel;Nombre\n';
        Object.entries(stats.potentiels).forEach(([potentiel, count]) => {
          csvContent += `${safeString(potentiel)};${count}\n`;
        });
        csvContent += '\n';
      }
  
      // Top ressources
      if (stats.topRessources && stats.topRessources.length > 0) {
        csvContent += 'TOP RESSOURCES À HAUT POTENTIEL\n';
        csvContent += 'Position;Nom;Type\n';
        stats.topRessources.forEach((ressource, index) => {
          csvContent += `${index + 1};${safeString(ressource.nom)};${safeString(ressource.type)}\n`;
        });
      }
  
      // Télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      console.log('✅ Statistiques CSV générées!');
      return true;
  
    } catch (error) {
      console.error('❌ Erreur export statistiques:', error);
      throw new Error(`Échec de l'export des statistiques: ${error.message}`);
    }
  };
  
  // Fonctions PDF temporairement désactivées
  export const exportToPDF = () => {
    throw new Error('Export PDF temporairement désactivé - Utilisez le format CSV');
  };
  
  export const exportDashboardPDF = () => {
    throw new Error('Export PDF dashboard temporairement désactivé - Utilisez le format CSV');
  };
  
  export const genererRapportComplet = () => {
    throw new Error('Rapport complet temporairement désactivé - Utilisez le format CSV');
  };
  
  // Export des données brutes pour analyse
  export const exporterDonneesBrutes = (ressources) => {
    return {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRessources: ressources.length,
        application: APP_CONFIG.name,
        version: APP_CONFIG.version
      },
      ressources: ressources.map(r => ({
        id: r.id,
        nom: r.nom,
        type: r.type,
        description: r.description,
        potentiel: r.potentiel,
        etat_utilisation: r.etat_utilisation,
        contact_nom: r.contact_nom,
        contact_tel: r.contact_tel,
        commune_id: r.commune_id,
        latitude: r.latitude,
        longitude: r.longitude,
        created_at: r.created_at,
        updated_at: r.updated_at
      }))
    };
  };