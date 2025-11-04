// components/CarteCommunaleMobile.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ============================================================================
// CONFIGURATION DES ICÔNES LEAFLET
// ============================================================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// URL de base de votre backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============================================================================
// CACHE POUR LES CONTOURS
// ============================================================================
const contoursCache = new Map();

const fetchCommuneBoundaries = async (communeId) => {
  if (contoursCache.has(communeId)) {
    return contoursCache.get(communeId);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/communes/${communeId}/contours`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    
    const result = await response.json();
    if (result.success && result.data) {
      contoursCache.set(communeId, result.data);
      return result.data;
    } else {
      throw new Error(result.error || 'Erreur inconnue');
    }
  } catch (error) {
    console.error('Erreur récupération contours:', error);
    return null;
  }
};

// COMPOSANT BOUTON STYLE FLUTTER
const FlutterButton = ({ icon, title, onClick, color = '#00853f', isActive = false, badge }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: isActive ? color : 'white',
        border: `2px solid ${isActive ? color : '#e0e0e0'}`,
        color: isActive ? 'white' : color,
        fontSize: '16px',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        marginBottom: '8px',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
      }}
      title={title}
    >
      {icon}
      {badge && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: '#ff3b30',
          color: 'white',
          borderRadius: '8px',
          width: '16px',
          height: '16px',
          fontSize: '9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          border: '1px solid white'
        }}>
          {badge}
        </span>
      )}
    </button>
  );
};

// COMPOSANT CONTROLEUR BOUTONS DROITE STYLE FLUTTER
const FlutterControls = ({ onAddClick, onLocateClick, onLayersClick, isLocating, isAddingMode }) => {
  return (
    <div style={{
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* BOUTON AJOUTER RESSOURCE */}
      <FlutterButton
        icon={isAddingMode ? "❌" : "➕"}
        title={isAddingMode ? "Annuler l'ajout" : "Ajouter une ressource"}
        onClick={onAddClick}
        color={isAddingMode ? "#dc2626" : "#00853f"}
        isActive={isAddingMode}
      />
      
      {/* BOUTON LOCALISATION */}
      <FlutterButton
        icon={isLocating ? "⏳" : "📍"}
        title="Localiser ma position"
        onClick={onLocateClick}
        color="#007AFF"
        isActive={isLocating}
      />
      
      {/* BOUTON FONDS DE CARTE */}
      <FlutterButton
        icon="🗺️"
        title="Changer le fond de carte"
        onClick={onLayersClick}
        color="#5856D6"
      />
    </div>
  );
};

// COMPOSANT ZOOM PERSONNALISÉ À DROITE
const CustomZoomControl = () => {
  const map = useMap();

  return (
    <div style={{
      position: 'absolute',
      right: '10px',
      top: '100px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      border: '2px solid #e0e0e0'
    }}>
      <button
        onClick={() => map.zoomIn()}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          background: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          color: '#00853f'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'white';
        }}
        title="Zoom avant"
      >
        ➕
      </button>
      
      <div style={{
        height: '1px',
        background: '#e0e0e0'
      }} />
      
      <button
        onClick={() => map.zoomOut()}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          background: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          color: '#00853f'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'white';
        }}
        title="Zoom arrière"
      >
        ➖
      </button>
    </div>
  );
};

// COMPOSANT LOCALISATION OPTIMISÉ
const LocateControl = ({ onLocatingChange, onLocate }) => {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const locateUser = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    if (onLocatingChange) onLocatingChange(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 16);

        if (window.currentLocationMarker) {
          map.removeLayer(window.currentLocationMarker);
        }

        window.currentLocationMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            html: `<div style="position: relative; width: 20px; height: 20px;">
              <div style="position: absolute; top: 0; left: 0; width: 20px; height: 20px; background: rgba(0, 122, 255, 0.3); border-radius: 50%; animation: ripple 2s infinite;"></div>
              <div style="position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #007AFF; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>
            </div>`,
            className: 'modern-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })
        }).addTo(map).bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong>📍 Votre position</strong><br>
            <small>Lat: ${latitude.toFixed(4)}°</small><br>
            <small>Lng: ${longitude.toFixed(4)}°</small>
          </div>
        `).openPopup();

        setIsLocating(false);
        if (onLocatingChange) onLocatingChange(false);
      },
      (error) => {
        setIsLocating(false);
        if (onLocatingChange) onLocatingChange(false);
        
        L.popup().setLatLng(map.getCenter()).setContent(`
          <div style="text-align: center; padding: 10px;">
            <div style="font-size: 18px; margin-bottom: 6px;">❌</div>
            <strong style="color: #dc2626; font-size: 12px;">Géolocalisation impossible</strong>
          </div>
        `).openOn(map);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Écouter les demandes de localisation
  useEffect(() => {
    if (onLocate) {
      locateUser();
    }
  }, [onLocate]);

  return null;
};

// COMPOSANT SÉLECTEUR DE FOND DE CARTE STYLE FLUTTER
const FlutterLayersControl = ({ onBasemapChange, isOpen, onClose }) => {
  const [basemap, setBasemap] = useState('osm');
  
  const handleBasemapChange = (newBasemap) => { 
    setBasemap(newBasemap); 
    if (onBasemapChange) onBasemapChange(newBasemap); 
    if (onClose) onClose();
  };

  const basemapOptions = [
    { value: 'osm', label: '🗺️', name: 'Carte Standard' },
    { value: 'satellite', label: '🛰️', name: 'Satellite' }
  ];

  if (!isOpen) return null;

  return (
    <>
      <div style={{
        position: 'absolute',
        right: '60px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        zIndex: 1001,
        overflow: 'hidden',
        border: '2px solid #e0e0e0',
        minWidth: '150px'
      }}>
        {basemapOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleBasemapChange(option.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: basemap === option.value ? '#f0f9f0' : 'white',
              border: 'none',
              borderBottom: '1px solid #f0f0f0',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = basemap === option.value ? '#f0f9f0' : 'white';
            }}
          >
            <span style={{ fontSize: '16px' }}>{option.label}</span>
            <span style={{ fontSize: '12px', color: '#666' }}>{option.name}</span>
          </button>
        ))}
      </div>

      {/* Overlay pour fermer le menu */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000
        }}
        onClick={onClose}
      />
    </>
  );
};

// FONCTIONS API
const searchCommunesAPI = async (searchTerm) => {
  try {
    const response = await fetch(`${API_BASE_URL}/communes/search/${encodeURIComponent(searchTerm)}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success) return result.data;
    }
    return [];
  } catch (error) {
    console.error('Erreur recherche communes:', error);
    return [];
  }
};

// COMPOSANT RECHERCHE COMMUNES
const SearchBarCommunes = ({ onCommuneSelect, communesData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim() || term.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const localResults = communesData.filter(commune =>
        commune.nom.toLowerCase().includes(term.toLowerCase()) ||
        (commune.region && commune.region.toLowerCase().includes(term.toLowerCase()))
      ).slice(0, 6);

      setResults(localResults);
      setShowResults(true);

      const apiResults = await searchCommunesAPI(term);
      if (apiResults && apiResults.length > 0) {
        setResults(apiResults);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCommune = async (commune) => {
    setSearchTerm('⏳ Chargement...');
    setShowResults(false);

    try {
      if (commune.id) {
        const contours = await fetchCommuneBoundaries(commune.id);
        if (contours) {
          commune = { ...commune, ...contours };
        }
      }
      if (onCommuneSelect) onCommuneSelect(commune);
      setSearchTerm('');
      setIsFocused(false);
    } catch (error) {
      console.error('Erreur:', error);
      setSearchTerm(commune.nom);
      setShowResults(false);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: '90%'
    }}>
      <input
        type="text"
        placeholder="🔍 Rechercher une commune..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '20px',
          border: `2px solid ${isFocused ? '#00a651' : '#00853f'}`,
          fontSize: '14px',
          boxShadow: isFocused ? '0 4px 15px rgba(0,133,63,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          outline: 'none',
          background: 'white',
          transition: 'all 0.3s ease',
        }}
      />

      {isSearching && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '15px',
          transform: 'translateY(-50%)',
          color: '#00853f'
        }}>
          ⏳
        </div>
      )}

      {showResults && results.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          marginTop: '6px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid #e0e0e0'
        }}>
          {results.map((commune, index) => (
            <div
              key={commune.id || index}
              onClick={() => handleSelectCommune(commune)}
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00853f, #00a651)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: 'white'
              }}>
                🏛️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>{commune.nom}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{commune.region}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// COMPOSANT CONTRÔLEUR DE CARTE
const MapController = () => {
  const map = useMap();
  useEffect(() => {
    console.log('🗺️ Carte mobile style Flutter initialisée');
  }, [map]);
  return null;
};

// ============================================================================
// CONFIGURATION DES FONDS DE CARTE
// ============================================================================
const BASEMAPS = {
  osm: {
    name: 'Carte Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; ArcGIS'
  }
};

// COMPOSANT COUCHE DE CARTE DYNAMIQUE
const DynamicTileLayer = ({ basemap }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [basemap, map]);

  const currentBasemap = BASEMAPS[basemap] || BASEMAPS.osm;
  return <TileLayer attribution={currentBasemap.attribution} url={currentBasemap.url} />;
};

// ============================================================================
// CONFIGURATION DES ICÔNES ET POPUPS MOBILE
// ============================================================================
const creerIcone = (couleur) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${couleur}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icones = {
  'Agricole': creerIcone('green'),
  'Hydrique': creerIcone('blue'),
  'Commerciale': creerIcone('violet'),
  'Artisanale': creerIcone('orange'),
  'Touristique': creerIcone('red'),
  'Minérale': creerIcone('black'),
  'default': creerIcone('grey')
};

// Popup mobile optimisée
const MobilePopup = ({ ressource }) => (
  <div style={{ padding: '10px', maxWidth: '220px' }}>
    <h6 style={{ margin: '0 0 6px 0', color: '#00853f', fontSize: '14px' }}>{ressource.nom}</h6>
    <div style={{ marginBottom: '4px', fontSize: '12px' }}>
      <strong>Type:</strong> {ressource.type}
    </div>
    <div style={{ marginBottom: '4px', fontSize: '12px' }}>
      <strong>Potentiel:</strong> 
      <span style={{
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: '10px',
        fontSize: '11px',
        marginLeft: '4px',
        background: ressource.potentiel === 'élevé' ? '#dcfce7' : 
                   ressource.potentiel === 'moyen' ? '#fef9c3' : '#f3f4f6',
        color: ressource.potentiel === 'élevé' ? '#166534' : 
              ressource.potentiel === 'moyen' ? '#854d0e' : '#374151'
      }}>
        {ressource.potentiel}
      </span>
    </div>
    <div style={{ marginBottom: '6px', fontSize: '12px' }}>
      <strong>État:</strong> {ressource.etat_utilisation}
    </div>
    {ressource.description && (
      <div style={{ 
        marginTop: '6px', 
        color: '#666', 
        fontSize: '11px',
        borderTop: '1px solid #f0f0f0',
        paddingTop: '6px'
      }}>
        {ressource.description.substring(0, 100)}...
      </div>
    )}
  </div>
);

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================
const obtenirCoordonnees = (ressource) => {
  if (ressource.localisation && ressource.localisation.coordinates) {
    const [lng, lat] = ressource.localisation.coordinates;
    return [lat, lng];
  }
  if (ressource.latitude && ressource.longitude) {
    const lat = parseFloat(ressource.latitude);
    const lng = parseFloat(ressource.longitude);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  return [14.7167, -17.4677];
};

const getIconForRessource = (typeRessource) => icones[typeRessource] || icones.default;

const parseCoordinates = (commune) => {
  let lat, lng;

  if (commune.latitude !== undefined && commune.longitude !== undefined) {
    lat = parseFloat(commune.latitude);
    lng = parseFloat(commune.longitude);
  }

  if (isNaN(lat) || isNaN(lng)) {
    return [14.7167, -17.4677];
  }

  if (lat < 12 || lat > 17 || lng < -18 || lng > -11) {
    return [14.7167, -17.4677];
  }

  return [lat, lng];
};

// ============================================================================
// COMPOSANT PRINCIPAL - VERSION MOBILE STYLE FLUTTER
// ============================================================================
const CarteCommunaleMobile = ({
  ressources,
  communes,
  onCommuneSelect,
  onAddDataClick,
  formulairePosition
}) => {
  const positionDefaut = [14.7167, -17.4677];
  const mapRef = useRef();
  const [cartePrete, setCartePrete] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('osm');
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [locateTrigger, setLocateTrigger] = useState(0);
  
  // NOUVEAUX ÉTATS POUR LE MODE AJOUT
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [temporaryMarker, setTemporaryMarker] = useState(null);

  // Gestion du clic sur le bouton Ajouter
  const handleAddButtonClick = () => {
    if (isAddingMode) {
      // Désactiver le mode ajout
      setIsAddingMode(false);
      if (temporaryMarker && mapRef.current) {
        mapRef.current.removeLayer(temporaryMarker);
      }
      setTemporaryMarker(null);
    } else {
      // Activer le mode ajout
      setIsAddingMode(true);
      
      // Afficher un message d'instruction
      L.popup()
        .setLatLng(mapRef.current.getCenter())
        .setContent(`
          <div style="text-align: center; padding: 15px;">
            <div style="font-size: 24px; margin-bottom: 10px;">📍</div>
            <strong style="color: #00853f;">Mode Ajout Activé</strong><br/>
            <small>Cliquez sur la carte pour placer la ressource</small>
          </div>
        `)
        .openOn(mapRef.current);
    }
  };

  // Gestion du clic sur la carte en mode ajout
  useEffect(() => {
    if (!mapRef.current || !isAddingMode) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      
      // Supprimer l'ancien marqueur temporaire
      if (temporaryMarker && mapRef.current.hasLayer(temporaryMarker)) {
        mapRef.current.removeLayer(temporaryMarker);
      }

      // Créer un nouveau marqueur temporaire
      const newMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div style="background: #ff6b35; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.4); animation: pulse 1.5s infinite;">📌</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(mapRef.current);

      setTemporaryMarker(newMarker);

      // Ouvrir le formulaire avec la position sélectionnée
      if (onAddDataClick) {
        onAddDataClick({ lat, lng });
      }

      // Désactiver le mode ajout
      setIsAddingMode(false);
    };

    // Ajouter l'événement de clic
    mapRef.current.on('click', handleMapClick);

    // Nettoyer l'événement
    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [isAddingMode, temporaryMarker, onAddDataClick]);

  // Nettoyage quand le mode ajout est désactivé
  useEffect(() => {
    if (!isAddingMode && temporaryMarker && mapRef.current) {
      if (mapRef.current.hasLayer(temporaryMarker)) {
        mapRef.current.removeLayer(temporaryMarker);
      }
      setTemporaryMarker(null);
    }
  }, [isAddingMode, temporaryMarker]);

  // Gestion de la position du formulaire
  useEffect(() => {
    if (formulairePosition && mapRef.current) {
      const { lat, lng } = formulairePosition;
      const newPosition = [lat, lng];
      mapRef.current.setView(newPosition, 16);

      if (window.formulaireMarker) {
        mapRef.current.removeLayer(window.formulaireMarker);
      }

      window.formulaireMarker = L.marker(newPosition, {
        icon: L.divIcon({
          html: `<div style="background: #ff6b35; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); animation: pulse 1.5s infinite;">📌</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current).bindPopup(`
        <div style="padding: 8px; text-align: center; min-width: 160px;">
          <strong style="color: #ff6b35; font-size: 12px;">📍 Position du formulaire</strong><br/>
          <small>Lat: ${lat.toFixed(6)}</small><br/>
          <small>Lng: ${lng.toFixed(6)}</small>
        </div>
      `).openPopup();
    }
  }, [formulairePosition]);

  // Gestion de la sélection des communes
  const handleCommuneSelect = useCallback(async (commune) => {
    if (!mapRef.current) return;

    try {
      let coordinates = parseCoordinates(commune);

      // Nettoyer les marqueurs précédents
      if (window.communeMarker && mapRef.current.hasLayer(window.communeMarker)) {
        mapRef.current.removeLayer(window.communeMarker);
      }
      if (window.communeBoundaryLayer && mapRef.current.hasLayer(window.communeBoundaryLayer)) {
        mapRef.current.removeLayer(window.communeBoundaryLayer);
      }

      let boundaries = null;
      let communeData = commune;

      // Récupérer les contours si disponible
      if (communeData.id) {
        const apiData = await fetchCommuneBoundaries(communeData.id);
        if (apiData) {
          communeData = { ...communeData, ...apiData };
          boundaries = apiData.geometrie;
          if (apiData.latitude && apiData.longitude) {
            coordinates = [apiData.latitude, apiData.longitude];
          }
        }
      }

      // Afficher les contours si disponibles
      if (boundaries) {
        window.communeBoundaryLayer = L.geoJSON(boundaries, {
          style: {
            color: '#00853f',
            weight: 2,
            opacity: 0.8,
            fillColor: '#00853f',
            fillOpacity: 0.15,
            dashArray: '5, 5'
          }
        }).addTo(mapRef.current);
        const bounds = window.communeBoundaryLayer.getBounds();
        mapRef.current.fitBounds(bounds, { padding: [15, 15] });
      } else {
        mapRef.current.setView(coordinates, 12);
      }

      // Ajouter le marqueur de la commune
      window.communeMarker = L.marker(coordinates, {
        icon: L.divIcon({
          html: `<div style="background: #00853f; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏛️</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current).bindPopup(`
        <div style="padding: 8px; text-align: center; min-width: 180px;">
          <strong style="color: #00853f; font-size: 13px;">🏛️ ${communeData.nom}</strong><br/>
          <div style="margin-top: 4px; text-align: left; font-size: 11px;">
            <small><strong>Région:</strong> ${communeData.region || 'Non spécifiée'}</small><br/>
            ${communeData.departement ? `<small><strong>Département:</strong> ${communeData.departement}</small><br/>` : ''}
            ${boundaries ? `<small><strong>✅ Contours disponibles</strong></small>` : '<small><strong>❌ Contours non disponibles</strong></small>'}
          </div>
        </div>
      `).openPopup();

      setSelectedCommune(communeData);
    } catch (error) {
      console.error('Erreur affichage commune:', error);
    }

    if (onCommuneSelect) onCommuneSelect(commune);
  }, [onCommuneSelect]);

  // Nettoyage
  useEffect(() => {
    return () => {
      delete window.communeBoundaryLayer;
      delete window.communeMarker;
      delete window.formulaireMarker;
      delete window.currentLocationMarker;
    };
  }, []);

  // Filtrage des ressources
  const ressourcesAvecCoordonnees = ressources ? ressources.filter(ressource => {
    const coords = obtenirCoordonnees(ressource);
    return coords && coords[0] !== positionDefaut[0] && coords[1] !== positionDefaut[1];
  }) : [];

  const handleLocateClick = () => {
    setLocateTrigger(prev => prev + 1);
  };

  const handleLayersClick = () => {
    setShowLayersMenu(true);
  };

  const handleCloseLayersMenu = () => {
    setShowLayersMenu(false);
  };

  return (
    <div className="carte-mobile-container" style={{ 
      height: '100%', 
      width: '100%',
      position: 'relative'
    }}>

      {/* BARRE DE RECHERCHE */}
      <SearchBarCommunes
        onCommuneSelect={handleCommuneSelect}
        communesData={communes}
      />

      {/* INDICATEUR DE MODE AJOUT */}
      {isAddingMode && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#00853f',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'pulse 2s infinite'
        }}>
          <span>📍</span>
          Mode ajout activé - Cliquez sur la carte
        </div>
      )}

      {/* CONTENEUR DE LA CARTE */}
      <MapContainer
        center={positionDefaut}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
        whenReady={() => setCartePrete(true)}
      >

        {/* OUTILS MOBILE */}
        <MapController />
        
        {/* ZOOM CONTROL PERSONNALISÉ À DROITE */}
        <CustomZoomControl />
        
        {/* BOUTONS DE CONTRÔLE STYLE FLUTTER À DROITE */}
        <FlutterControls
          onAddClick={handleAddButtonClick}
          onLocateClick={handleLocateClick}
          onLayersClick={handleLayersClick}
          isLocating={isLocating}
          isAddingMode={isAddingMode}
        />
        
        {/* MENU DES FONDS DE CARTE */}
        <FlutterLayersControl 
          onBasemapChange={setCurrentBasemap} 
          isOpen={showLayersMenu}
          onClose={handleCloseLayersMenu}
        />
        
        {/* LOCALISATION */}
        <LocateControl 
          onLocatingChange={setIsLocating} 
          onLocate={locateTrigger > 0}
        />
        
        {/* FOND DE CARTE */}
        <DynamicTileLayer basemap={currentBasemap} />

        {/* MARQUEURS DES RESSOURCES */}
        {cartePrete && ressourcesAvecCoordonnees.map((ressource) => {
          const coords = obtenirCoordonnees(ressource);
          return (
            <Marker key={ressource.id} position={coords} icon={getIconForRessource(ressource.type)}>
              <Popup>
                <MobilePopup ressource={ressource} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* STYLES */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 
          0% { transform: scale(1); opacity: 1; } 
          50% { transform: scale(1.05); opacity: 0.8; } 
          100% { transform: scale(1); opacity: 1; } 
        }
        @keyframes ripple { 
          0% { transform: scale(1); opacity: 1; } 
          100% { transform: scale(3); opacity: 0; } 
        }
        
        .carte-mobile-container {
          animation: fadeIn 0.5s ease;
        }
      `}</style>
    </div>
  );
};

export default CarteCommunaleMobile;