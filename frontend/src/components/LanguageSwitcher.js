import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSwitcher = ({ isMobile = false }) => {
  const { language, switchLanguage } = useTranslation();

  console.log('🌍 LanguageSwitcher rendu - Langue actuelle:', language);

  const handleLanguageClick = (newLanguage) => {
    console.log('🖱️ Clic sur langue:', newLanguage);
    switchLanguage(newLanguage);
    // Forcer un re-render
    window.location.reload();
  };

  if (isMobile) {
    return (
      <select 
        className="flutter-input"
        value={language}
        onChange={(e) => handleLanguageClick(e.target.value)}
        style={{ 
          width: 'auto', 
          minWidth: '100px',
          fontSize: '14px',
          padding: '8px 12px'
        }}
      >
        <option value="fr">🇫🇷 FR</option>
        <option value="wo">🇸🇳 WO</option>
      </select>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <button
        className={`flutter-btn ${language === 'fr' ? 'primary' : 'secondary'}`}
        onClick={() => handleLanguageClick('fr')}
        style={{
          padding: '6px 10px',
          fontSize: '11px',
          minWidth: 'auto',
        }}
      >
        🇫🇷 Français
      </button>
      
      <button
        className={`flutter-btn ${language === 'wo' ? 'primary' : 'secondary'}`}
        onClick={() => handleLanguageClick('wo')}
        style={{
          padding: '6px 10px',
          fontSize: '11px',
          minWidth: 'auto',
        }}
      >
        🇸🇳 Wolof
      </button>
    </div>
  );
};

export default LanguageSwitcher;