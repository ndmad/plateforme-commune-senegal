import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSwitcher = ({ isMobile }) => {
  const { language, changeLanguage } = useTranslation();

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'wo', name: 'Wolof', flag: '🇸🇳' }
  ];

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 1050
      }}>
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: 'var(--elevation-2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginRight: '16px'
    }}>
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`flutter-btn ${language === lang.code ? 'primary' : 'secondary'}`}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            minWidth: 'auto'
          }}
        >
          <span style={{ marginRight: '4px' }}>{lang.flag}</span>
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;