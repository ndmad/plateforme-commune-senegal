import React, { createContext, useContext, useState, useEffect } from 'react';

// Dictionnaires de traduction
const translations = {
  fr: {
    // Général
    'welcome': 'Bienvenue',
    'loading': 'Chargement...',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'edit': 'Modifier',
    
    // Navigation
    'map': 'Carte',
    'dashboard': 'Tableau de bord',
    'filters': 'Filtres',
    'list': 'Liste',
    'logout': 'Déconnexion',
    
    // Ressources
    'resources': 'Ressources',
    'add_resource': 'Ajouter une ressource',
    'resource_name': 'Nom de la ressource',
    'resource_type': 'Type de ressource',
    'description': 'Description',
    'potential': 'Potentiel',
    'usage_state': "État d'utilisation",
    
    // Dashboard
    'total_resources': 'Ressources totales',
    'covered_municipalities': 'Communes couvertes',
    'contributors': 'Contributeurs',
    'optimization_rate': "Taux d'optimisation",
    'high_potential_resources': 'Ressources à haut potentiel',
    
    // Types de ressources
    'agricultural': 'Agricole',
    'water': 'Hydrique',
    'economic': 'Économique',
    'human': 'Humaine',
    'mining': 'Minière',
    
    // Potentiels
    'high': 'Élevé',
    'medium': 'Moyen',
    'low': 'Faible',
    
    // États d'utilisation
    'unexploited': 'Inexploité',
    'underused': 'Sous-utilisé',
    'optimized': 'Optimisé'
  },
  
  wo: {
    // Général
    'welcome': 'Dégg maa',
    'loading': 'Maa ngi laaj...',
    'save': 'Sàkku',
    'cancel': 'Ràññee',
    'delete': 'Far',
    'edit': 'Soppi',
    
    // Navigation
    'map': 'Kàrt',
    'dashboard': 'Tabloo bu góor',
    'filters': 'Pàkke',
    'list': 'Tudd',
    'logout': 'Genne wàll',
    
    // Ressources
    'resources': 'Jëfandikukat',
    'add_resource': 'Yokku jëfandikukat',
    'resource_name': 'Turu jëfandikukat bi',
    'resource_type': 'Màkku jëfandikukat bi',
    'description': 'Firi',
    'potential': 'Doole',
    'usage_state': 'Màkku jëfandiku',
    
    // Dashboard
    'total_resources': 'Jëfandikukat yépp',
    'covered_municipalities': 'Dëkk bu am',
    'contributors': 'Njiitu',
    'optimization_rate': 'Tàawu baaxa',
    'high_potential_resources': 'Jëfandikukat yu am doole',
    
    // Types de ressources - Traductions approximatives
    'agricultural': 'Nguur',
    'water': 'Ndox',
    'economic': 'Koom-koom',
    'human': 'Nit',
    'mining': 'Dàll',
    
    // Potentiels
    'high': 'Kawe',
    'medium': 'Gennaw',
    'low': 'Suufe',
    
    // États d'utilisation
    'unexploited': 'Dul jëfandiku',
    'underused': 'Jëfandiku gànn',
    'optimized': 'Baax na'
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