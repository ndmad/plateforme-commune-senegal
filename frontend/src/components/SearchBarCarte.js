import React, { useState, useEffect, useRef } from 'react';

const SearchBarCarte = ({ onLocationSelect, isMobile = false, communesData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [communeBoundaries, setCommuneBoundaries] = useState(null);
  const searchRef = useRef(null);

  // Recherche dans les communes de la base de données
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Filtrer les communes de la base de données
      const filteredCommunes = communesData.filter(commune => 
        commune.nom.toLowerCase().includes(query.toLowerCase()) ||
        (commune.region && commune.region.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 8); // Limiter à 8 résultats
      
      setSuggestions(filteredCommunes);
    } catch (error) {
      console.error('Erreur recherche commune:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les contours d'une commune depuis la base de données
  const getCommuneBoundaries = async (commune) => {
    try {
      // Si la commune a des géométries dans la base de données
      if (commune.geometrie || commune.contours) {
        return commune.geometrie || commune.contours;
      }
      
      // Sinon, essayer de récupérer via une API interne
      if (commune.id) {
        const response = await fetch(`/api/communes/${commune.id}/contours`);
        if (response.ok) {
          const data = await response.json();
          return data.geometrie;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur récupération contours:', error);
      return null;
    }
  };

  // Gérer la sélection d'une commune
  const handleSelectLocation = async (commune) => {
    setIsLoading(true);
    
    try {
      let boundaries = null;
      
      // Récupérer les contours depuis la base de données
      boundaries = await getCommuneBoundaries(commune);

      const location = {
        lat: parseFloat(commune.latitude),
        lng: parseFloat(commune.longitude),
        name: commune.nom,
        region: commune.region,
        boundingbox: commune.boundingbox || [
          (parseFloat(commune.latitude) - 0.1).toString(),
          (parseFloat(commune.latitude) + 0.1).toString(),
          (parseFloat(commune.longitude) - 0.1).toString(),
          (parseFloat(commune.longitude) + 0.1).toString()
        ],
        osm_id: commune.osm_id,
        osm_type: commune.osm_type,
        boundaries: boundaries,
        isCommune: true,
        communeData: commune // Inclure toutes les données de la commune
      };
      
      onLocationSelect(location);
      setSearchTerm(commune.nom);
      setSuggestions([]);
      
    } catch (error) {
      console.error('Erreur sélection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour centrer sur une région avec un bounding box
  const focusOnBoundingBox = (boundingbox, map) => {
    if (boundingbox && boundingbox.length === 4) {
      const [south, north, west, east] = boundingbox.map(coord => parseFloat(coord));
      const bounds = L.latLngBounds(
        L.latLng(south, west),
        L.latLng(north, east)
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
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

  // Obtenir l'icône selon le type de lieu
  const getPlaceIcon = (commune) => {
    if (commune.type === 'ville' || commune.nom.includes('Dakar')) {
      return '🏙️';
    } else if (commune.type === 'commune') {
      return '🏛️';
    } else if (commune.population > 100000) {
      return '🏘️';
    }
    return '🏡';
  };

  // Obtenir le type affichable
  const getPlaceType = (commune) => {
    if (commune.type === 'ville') return 'Ville';
    if (commune.type === 'commune') return 'Commune';
    if (commune.type === 'arrondissement') return 'Arrondissement';
    return 'Localité';
  };

  return (
    <div 
      ref={searchRef}
      className="search-bar-carte"
      style={{
        position: 'absolute',
        top: isMobile ? '70px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: '500px',
        width: '90%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden'
      }}
    >
      {/* Barre de recherche */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: suggestions.length > 0 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none'
      }}>
        <span style={{ 
          marginRight: '12px', 
          fontSize: '18px',
          color: '#00853f'
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
            color: '#1e293b',
            fontWeight: '500'
          }}
        />
        
        {isLoading && (
          <div style={{ 
            width: '16px', 
            height: '16px',
            marginLeft: '12px',
            border: '2px solid #f3f4f6',
            borderTop: '2px solid #00853f',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
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
              borderRadius: '6px',
              color: '#64748b',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f1f5f9';
              e.target.style.color = '#1e293b';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#64748b';
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          background: 'rgba(255, 255, 255, 0.98)'
        }}>
          {suggestions.map((commune, index) => (
            <div
              key={`${commune.id}-${index}`}
              onClick={() => handleSelectLocation(commune)}
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: getPlaceType(commune) === 'Commune' 
                  ? 'linear-gradient(135deg, #00853f, #00a651)' 
                  : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'white',
                flexShrink: 0
              }}>
                {getPlaceIcon(commune)}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {commune.nom}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: getPlaceType(commune) === 'Commune' ? '#00853f' : '#3b82f6',
                    background: getPlaceType(commune) === 'Commune' ? '#f0f9f4' : '#f0f9ff',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {getPlaceType(commune)}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: '1.4',
                  marginBottom: '4px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {commune.region || 'Sénégal'}
                  {commune.departement && `, ${commune.departement}`}
                </div>
                
                <div style={{ 
                  fontSize: '11px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {commune.population && (
                    <>
                      <span>👥 {commune.population.toLocaleString()}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>🎯 {commune.type || 'localité'}</span>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: '#00853f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white'
                }}>
                  →
                </div>
                <div style={{
                  fontSize: '9px',
                  color: '#00853f',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Voir
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aucun résultat */}
      {searchTerm && suggestions.length === 0 && !isLoading && (
        <div style={{
          padding: '20px 16px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '14px',
          background: 'rgba(255, 255, 255, 0.8)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Aucune commune trouvée</div>
          <div style={{ fontSize: '12px' }}>Essayez avec un autre nom de commune ou ville</div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .search-bar-carte > div:last-child {
          animation: slideDown 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default SearchBarCarte;