import React, { useState, useEffect, useRef } from 'react';

const SearchBarCarte = ({ onLocationSelect, isMobile = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);

  // Recherche de lieux avec Nominatim (OpenStreetMap)
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}+Sénégal&limit=5&countrycodes=sn&accept-language=fr`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Erreur recherche lieu:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la sélection d'un lieu
  const handleSelectLocation = (place) => {
    const location = {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      name: place.display_name,
      boundingbox: place.boundingbox
    };
    
    onLocationSelect(location);
    setSearchTerm(place.display_name);
    setSuggestions([]);
  };

  // Fermer les suggestions en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={searchRef}
      className="search-bar-carte"
      style={{
        position: 'absolute',
        top: isMobile ? '70px' : '20px',
        left: '50%', // ← AJOUTEZ CETTE LIGNE
        transform: 'translateX(-50%)', // ← ET CETTE LIGNE
        right: '20px',
        zIndex: 1000,
        maxWidth: '400px',
        width: '90%', // ← MODIFIEZ
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--elevation-3)',
        overflow: 'hidden'
      }}
    >
      {/* Barre de recherche */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: suggestions.length > 0 ? '1px solid #f1f5f9' : 'none'
      }}>
        <span style={{ 
          marginRight: '12px', 
          fontSize: '18px',
          color: 'var(--on-background)'
        }}>
          🔍
        </span>
        
        <input
          type="text"
          placeholder="Rechercher une commune, ville ou lieu au Sénégal..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            searchLocation(e.target.value);
          }}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '14px',
            color: 'var(--on-surface)'
          }}
        />
        
        {isLoading && (
          <div className="flutter-spinner" style={{ 
            width: '16px', 
            height: '16px',
            marginLeft: '12px'
          }}></div>
        )}
        
        {searchTerm && !isLoading && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSuggestions([]);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--on-background)'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'var(--surface)'
        }}>
          {suggestions.map((place) => (
            <div
              key={place.place_id}
              onClick={() => handleSelectLocation(place)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f8fafc',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface)';
              }}
            >
              <span style={{ 
                fontSize: '16px',
                color: 'var(--primary-600)',
                flexShrink: 0
              }}>
                📍
              </span>
              <div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'var(--on-surface)',
                  marginBottom: '2px'
                }}>
                  {place.display_name.split(',')[0]}
                </div>
                <div style={{ 
                  fontSize: '12px',
                  color: 'var(--on-background)',
                  lineHeight: '1.3'
                }}>
                  {place.display_name.split(',').slice(1).join(',').trim()}
                </div>
                <div style={{ 
                  fontSize: '11px',
                  color: 'var(--primary-600)',
                  marginTop: '4px'
                }}>
                  {place.type} • {place.class}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBarCarte;