import { useContext, createContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';



const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'fr';
  });

  const t = (key, params = {}) => {
    let translation = translations[language]?.[key] || translations['fr'][key] || key;
    
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    
    return translation;
  };

  const switchLanguage = (lang) => {
    console.log('🔄 Changement de langue vers:', lang);
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  useEffect(() => {
    console.log('🌍 Langue mise à jour:', language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <TranslationContext.Provider value={{ t, language, switchLanguage }}>
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