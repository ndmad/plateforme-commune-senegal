import React, { createContext, useContext, useState, useEffect } from 'react';

// Dictionnaires de traduction COMPLETS
const translations = {
  fr: {
    // Général
    'welcome': 'Bienvenue',
    'loading': 'Chargement...',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'edit': 'Modifier',
    'search': 'Rechercher...',
    'filter': 'Filtrer',
    'export': 'Exporter',
    
    // Navigation
    'map': 'Carte',
    'dashboard': 'Tableau de bord',
    'filters': 'Filtres',
    'list': 'Liste',
    'logout': 'Déconnexion',
    'login': 'Connexion',
    'profile': 'Profil',
    
    // Ressources
    'resources': 'Ressources',
    'add_resource': 'Ajouter une ressource',
    'resource_name': 'Nom de la ressource',
    'resource_type': 'Type de ressource',
    'description': 'Description',
    'potential': 'Potentiel',
    'usage_state': "État d'utilisation",
    'location': 'Localisation',
    'contact': 'Contact',
    
    // Types de ressources
    'agricultural': 'Agricole',
    'water': 'Hydrique',
    'economic': 'Économique',
    'human': 'Humaine',
    'mining': 'Minière',
    'tourist': 'Touristique',
    'energy': 'Énergétique',
    
    // Potentiels
    'high': 'Élevé',
    'medium': 'Moyen',
    'low': 'Faible',
    'unspecified': 'Non spécifié',
    
    // États d'utilisation
    'unexploited': 'Inexploité',
    'underused': 'Sous-utilisé',
    'optimized': 'Optimisé',
    
    // Dashboard
    'total_resources': 'Ressources totales',
    'covered_municipalities': 'Communes couvertes',
    'contributors': 'Contributeurs',
    'optimization_rate': "Taux d'optimisation",
    'high_potential_resources': 'Ressources à haut potentiel',
    'resource_distribution': 'Répartition des ressources',
    'by_type': 'Par type',
    'by_potential': 'Par potentiel',
    'monthly_evolution': 'Évolution mensuelle',
    'municipality_ranking': 'Classement des communes',
    'advanced_analytics': 'Analytics Avancés',
    
    // Carte
    'thematic_map': 'Carte thématique',
    'resource_density': 'Densité des ressources',
    'high_potential': 'Potentiel élevé',
    'optimization': 'Optimisation',
    
    // Communes
    'municipality': 'Commune',
    'municipalities': 'Communes',
    'position': 'Position',
    'score': 'Score',
    'details_by_type': 'Détail par type',
    
    // Export
    'export_data': 'Exporter les données',
    'export_statistics': 'Exporter les statistiques',
    'raw_data': 'Données brutes',
    'compatible_excel': 'Compatible Excel',
    
    // Actions
    'add': 'Ajouter',
    'modify': 'Modifier',
    'view': 'Voir',
    'confirm': 'Confirmer',
    'close': 'Fermer',
    
    // Messages
    'data_loaded': 'Données chargées avec succès',
    'resource_added': 'Ressource ajoutée avec succès',
    'resource_updated': 'Ressource modifiée avec succès',
    'resource_deleted': 'Ressource supprimée avec succès',
    'error_loading': 'Erreur lors du chargement',
    'welcome_back': 'Bienvenue de retour'
  },
  
  wo: {
    // Général
    'welcome': 'Dégg maa',
    'loading': 'Maa ngi laaj...',
    'save': 'Sàkku',
    'cancel': 'Ràññee',
    'delete': 'Far',
    'edit': 'Soppi',
    'search': 'Seet...',
    'filter': 'Filtre',
    'export': 'Jàppe',
    
    // Navigation
    'map': 'Kàrt',
    'dashboard': 'Tabloo bu góor',
    'filters': 'Pàkke',
    'list': 'Tudd',
    'logout': 'Genne wàll',
    'login': 'Dugg',
    'profile': 'Profil',
    
    // Ressources
    'resources': 'Jëfandikukat',
    'add_resource': 'Yokku jëfandikukat',
    'resource_name': 'Turu jëfandikukat bi',
    'resource_type': 'Màkku jëfandikukat bi',
    'description': 'Firi',
    'potential': 'Doole',
    'usage_state': 'Màkku jëfandiku',
    'location': 'Bàyyikaay',
    'contact': 'Nataal',
    
    // Types de ressources
    'agricultural': 'Nguur',
    'water': 'Ndox',
    'economic': 'Koom-koom',
    'human': 'Nit',
    'mining': 'Dàll',
    'tourist': 'Turist',
    'energy': 'Kàttan',
    
    // Potentiels
    'high': 'Kawe',
    'medium': 'Gennaw',
    'low': 'Suufe',
    'unspecified': 'Bul xam',
    
    // États d'utilisation
    'unexploited': 'Dul jëfandiku',
    'underused': 'Jëfandiku gànn',
    'optimized': 'Baax na',
    
    // Dashboard
    'total_resources': 'Jëfandikukat yépp',
    'covered_municipalities': 'Dëkk bu am',
    'contributors': 'Njiitu',
    'optimization_rate': 'Tàawu baaxa',
    'high_potential_resources': 'Jëfandikukat yu am doole',
    'resource_distribution': 'Sosu jëfandikukat',
    'by_type': 'Ci màkku',
    'by_potential': 'Ci doole',
    'monthly_evolution': 'Soowu weer',
    'municipality_ranking': 'Taamu dëkk',
    'advanced_analytics': 'Xool bu góor',
    
    // Carte
    'thematic_map': 'Kàrt bu am xalaat',
    'resource_density': 'Gàttu jëfandikukat',
    'high_potential': 'Doole kawe',
    'optimization': 'Baaxa',
    
    // Communes
    'municipality': 'Dëkk',
    'municipalities': 'Dëkk yi',
    'position': 'Nekku',
    'score': 'Pwà',
    'details_by_type': 'Xeetu ci màkku',
    
    // Export
    'export_data': 'Jàppe xibaar',
    'export_statistics': 'Jàppe sàkku',
    'raw_data': 'Xibaar bu wóoru',
    'compatible_excel': 'Excel di nangu',
    
    // Actions
    'add': 'Yokku',
    'modify': 'Soppi',
    'view': 'Gis',
    'confirm': 'Taal',
    'close': 'Tukk',
    
    // Messages
    'data_loaded': 'Xibaar di nañu leen jàppe',
    'resource_added': 'Jëfandikukat di nañu ko yokku',
    'resource_updated': 'Jëfandikukat di nañu ko soppi',
    'resource_deleted': 'Jëfandikukat di nañu ko far',
    'error_loading': 'Jàmmbur ci jàppug xibaar',
    'welcome_back': 'Déggal ci yaw',

    // Ajoutez dans les dictionnaires :
'login_success': 'Connexion réussie! Redirection...',
'login_error': 'Email ou mot de passe incorrect',
'connection_error': 'Erreur de connexion au serveur',
'platform': 'Plateforme',
'territorial_management': 'Gestion Territoriale',
'logging_in': 'Connexion en cours...',
'restricted_access': 'Accès réservé aux agents communaux autorisés',

// Dans le dictionnaire 'fr', ajoutez :
'administration': 'Administration',
'user_management': 'Gestion Utilisateurs',
'advanced_statistics': 'Statistiques Avancées',
'role': 'Rôle',

// Dans le dictionnaire 'wo', ajoutez :
'administration': 'Njàngale',
'user_management': 'Toppatoo njëkk',
'advanced_statistics': 'Sàkku bu góor',
'role': 'Nekku'
  }
};

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');
  const [t, setT] = useState(() => (key) => translations.fr[key] || key);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'fr';
    setLanguage(savedLanguage);
    setT(() => (key) => translations[savedLanguage][key] || translations.fr[key] || key);
  }, []);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    setT(() => (key) => translations[newLang][key] || translations.fr[key] || key);
    localStorage.setItem('preferredLanguage', newLang);
  };

  return (
    <TranslationContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};