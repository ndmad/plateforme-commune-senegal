import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import AnalysisToolsBar from './AnalysisToolsBar';

// Correction des icônes Leaflet
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
    console.log('📦 Contours depuis le cache:', communeId);
    return contoursCache.get(communeId);
  }

  try {
    console.log(`📍 Récupération des contours pour la commune ID: ${communeId}`);
    const response = await fetch(`${API_BASE_URL}/communes/${communeId}/contours`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ Contours reçus pour:', result.data.nom);
      contoursCache.set(communeId, result.data);
      return result.data;
    } else {
      throw new Error(result.error || 'Erreur inconnue');
    }
  } catch (error) {
    console.error('❌ Erreur récupération contours:', error);
    return null;
  }
};

// ============================================================================
// COMPOSANTS EXISTANTS
// ============================================================================

// COMPOSANT COORDONNÉES
const CoordinatesDisplay = ({ isMobile }) => {
  const map = useMap();
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    const updateCoordinates = (e) => {
      const point = e.latlng || map.getCenter();
      setCoordinates({ lat: point.lat.toFixed(6), lng: point.lng.toFixed(6) });
    };

    updateCoordinates({ latlng: map.getCenter() });
    map.on('mousemove', updateCoordinates);
    map.on('move', () => updateCoordinates({ latlng: map.getCenter() }));

    return () => {
      map.off('mousemove', updateCoordinates);
      map.off('move', () => updateCoordinates({ latlng: map.getCenter() }));
    };
  }, [map]);

  return (
    <div style={{
      position: 'absolute', bottom: '80px', right: '10px',
      background: 'rgba(255, 255, 255, 0.9)', color: '#333', padding: '4px 8px',
      borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', zIndex: 1000,
      border: '2px solid rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
      whiteSpace: 'nowrap', maxWidth: isMobile ? '140px' : '200px', lineHeight: '1.2'
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <span><span style={{ color: '#00853f', fontWeight: 'bold' }}>Lat:</span> {coordinates.lat}°</span>
        <span><span style={{ color: '#00853f', fontWeight: 'bold' }}>Lng:</span> {coordinates.lng}°</span>
      </div>
    </div>
  );
};

// COMPOSANT ÉCHELLE
const CustomScaleControl = ({ isMobile }) => {
  return (
    <ScaleControl position="bottomright" imperial={false} metric={true} style={{
      marginBottom: isMobile ? '50px' : '40px', marginRight: '10px'
    }} />
  );
};

// COMPOSANT INFO STATUT
const StatusInfo = ({ ressourcesCount, selectedCommune, currentBasemap, isMobile }) => {
  return (
    <div style={{
      position: 'absolute', bottom: '10px', left: '10px',
      background: 'rgba(255, 255, 255, 0.9)', color: '#333', padding: '6px 10px',
      borderRadius: '4px', fontSize: '11px', fontFamily: 'Arial, sans-serif', zIndex: 1000,
      border: '2px solid rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
      maxWidth: isMobile ? '200px' : '300px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontWeight: 'bold', color: '#00853f' }}>
          🗺️ {ressourcesCount} ressources | {currentBasemap.name}
        </div>
        {selectedCommune && (
          <div style={{ fontSize: '10px', color: '#666' }}>
            📍 {selectedCommune.nom} ({selectedCommune.region})
          </div>
        )}
      </div>
    </div>
  );
};

// COMPOSANT LOCALISATION
const LocateControl = ({ isMobile }) => {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);
        
        if (window.currentLocationMarker) map.removeLayer(window.currentLocationMarker);
        
        window.currentLocationMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            html: `<div style="position: relative; width: 24px; height: 24px;">
              <div style="position: absolute; top: 0; left: 0; width: 24px; height: 24px; background: rgba(0, 133, 63, 0.3); border-radius: 50%; animation: ripple 2s infinite;"></div>
              <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #00853f; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
            </div>`,
            className: 'modern-location-marker', iconSize: [24, 24], iconAnchor: [12, 12],
          })
        }).addTo(map).bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong>📍 Votre position</strong><br>
            <small>Lat: ${latitude.toFixed(4)}°</small><br>
            <small>Lng: ${longitude.toFixed(4)}°</small>
          </div>
        `).openPopup();

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        L.popup().setLatLng(map.getCenter()).setContent(`
          <div style="text-align: center; padding: 12px;">
            <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
            <strong style="color: #dc2626;">Erreur de géolocalisation</strong>
          </div>
        `).openOn(map);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    const LocateControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        const buttonStyle = isMobile ? `width: 50px; height: 50px; font-size: 20px; border-radius: 50%;` : `width: 45px; height: 45px; font-size: 18px; border-radius: 50%;`;
        
        container.innerHTML = `<button title="Localiser ma position" style="${buttonStyle} background: ${isLocating ? '#f59e0b' : '#00853f'}; border: 3px solid white; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease; animation: ${isLocating ? 'pulse 1.5s infinite' : 'none'}; outline: none;">${isLocating ? '⏳' : '📍'}</button>`;
        
        const button = container.querySelector('button');
        button.addEventListener('mouseenter', function() { this.style.transform = 'scale(1.1)'; this.style.background = isLocating ? '#d97706' : '#006b33'; });
        button.addEventListener('mouseleave', function() { this.style.transform = 'scale(1)'; this.style.background = isLocating ? '#f59e0b' : '#00853f'; });
        button.onclick = (e) => { e.preventDefault(); e.stopPropagation(); locateUser(); };
        
        return container;
      }
    });

    const locateControl = new LocateControl({ position: 'topleft' });
    locateControl.addTo(map);
    return () => { map.removeControl(locateControl); };
  }, [map, isMobile, isLocating]);

  return null;
};

// FONCTIONS API
const searchCommunesAPI = async (searchTerm) => {
  try {
    const response = await fetch(`${API_BASE_URL}/communes/search/${encodeURIComponent(searchTerm)}`);
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
    }
    return [];
  } catch (error) {
    console.error('Erreur recherche communes:', error);
    return [];
  }
};

// COMPOSANT RECHERCHE COMMUNES
const SearchBarCommunes = ({ onCommuneSelect, isMobile, communesData = [] }) => {
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
      ).slice(0, 8);
      
      setResults(localResults);
      setShowResults(true);
      
      console.log(`🔍 Recherche locale: ${localResults.length} résultats pour "${term}"`);
      
      searchCommunesAPI(term).then(apiResults => {
        if (apiResults && apiResults.length > 0) {
          console.log(`🔍 Résultats API: ${apiResults.length} résultats`);
          setResults(apiResults);
        }
      }).catch(apiError => {
        console.log('API de recherche non disponible, utilisation des données locales');
      });
      
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCommune = async (commune) => {
    console.log('Commune sélectionnée:', commune);
    
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
      console.error('❌ Erreur:', error);
      setSearchTerm(commune.nom);
    }
  };

  return (
    <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: isMobile ? '90%' : '400px' }}>
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
          borderRadius: '25px', 
          border: `2px solid ${isFocused ? '#00a651' : '#00853f'}`, 
          fontSize: '14px', 
          boxShadow: isFocused ? '0 4px 20px rgba(0, 133, 63, 0.3)' : '0 2px 10px rgba(0,0,0,0.1)', 
          outline: 'none', 
          background: 'white', 
          transition: 'all 0.3s ease', 
          transform: isFocused ? 'scale(1.02)' : 'scale(1)' 
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
          borderRadius: '12px', 
          marginTop: '8px', 
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)', 
          maxHeight: '300px', 
          overflowY: 'auto', 
          border: '1px solid #e0e0e0' 
        }}>
          {results.map((commune, index) => (
            <div 
              key={commune.id || index} 
              onClick={() => handleSelectCommune(commune)} 
              style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid #f0f0f0', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px' 
              }}
              onMouseEnter={(e) => { 
                e.target.style.background = '#f8f9fa'; 
                e.target.style.transform = 'translateX(5px)'; 
              }}
              onMouseLeave={(e) => { 
                e.target.style.background = 'white'; 
                e.target.style.transform = 'translateX(0)'; 
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
                color: 'white', 
                fontWeight: 'bold' 
              }}>
                🏛️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>{commune.nom}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Région: {commune.region}</div>
                {commune.departement && <div style={{ fontSize: '11px', color: '#888' }}>Département: {commune.departement}</div>}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#00853f', 
                background: '#e8f5e8', 
                padding: '4px 8px', 
                borderRadius: '12px', 
                fontWeight: '600' 
              }}>
                Aller
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// COMPOSANTS RESTANTS
const MapController = ({ isMobile }) => {
  const map = useMap();
  useEffect(() => { console.log('🗺️ MapController - Carte initialisée, mobile:', isMobile); }, [map, isMobile]);
  return null;
};

const BASEMAPS = {
  osm: { name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' },
  satellite: { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; ArcGIS' },
  topo: { name: 'Topographique', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap' },
  dark: { name: 'Sombre', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap & CARTO' }
};

const BasemapController = ({ onBasemapChange }) => {
  const [basemap, setBasemap] = useState('osm');
  const handleBasemapChange = (newBasemap) => { setBasemap(newBasemap); if (onBasemapChange) onBasemapChange(newBasemap); };
  return (
    <select 
      onChange={(e) => handleBasemapChange(e.target.value)} 
      value={basemap} 
      style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000, 
        padding: '8px 12px', 
        borderRadius: '8px', 
        border: '2px solid #00853f', 
        background: 'white', 
        fontSize: '14px', 
        fontWeight: '500', 
        color: '#333', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        cursor: 'pointer' 
      }}
    >
      <option value="osm">🗺️ OpenStreetMap</option>
      <option value="satellite">🛰️ Satellite</option>
      <option value="topo">🏔️ Topographique</option>
      <option value="dark">🌙 Sombre</option>
    </select>
  );
};

const DynamicTileLayer = ({ basemap }) => {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [basemap, map]);
  const currentBasemap = BASEMAPS[basemap] || BASEMAPS.osm;
  return <TileLayer attribution={currentBasemap.attribution} url={currentBasemap.url} />;
};

// Création des icônes
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

// Popups
const MobilePopup = ({ ressource }) => (
  <div className="mobile-popup">
    <h6 className="mb-2">{ressource.nom}</h6>
    <div className="mb-1"><strong>Type:</strong> {ressource.type}</div>
    <div className="mb-1"><strong>Potentiel:</strong> <span className={`badge ${ressource.potentiel === 'élevé' ? 'bg-success' : ressource.potentiel === 'moyen' ? 'bg-warning' : 'bg-secondary'} ms-1`}>{ressource.potentiel}</span></div>
    <div className="mb-1"><strong>État:</strong> {ressource.etat_utilisation}</div>
    {ressource.description && <div className="mt-2 text-muted small">{ressource.description.substring(0, 100)}...</div>}
  </div>
);

const DesktopPopup = ({ ressource }) => (
  <div>
    <h6>{ressource.nom}</h6>
    <p><strong>Type:</strong> {ressource.type}</p>
    <p><strong>Potentiel:</strong> {ressource.potentiel}</p>
    <p><strong>État:</strong> {ressource.etat_utilisation}</p>
    {ressource.description && <p className="text-muted">{ressource.description}</p>}
    <small className="text-muted">ID: {ressource.id}</small>
  </div>
);

// Fonctions utilitaires
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

// Fonction pour valider et parser les coordonnées
const parseCoordinates = (commune) => {
  console.log('📍 Parsing coordinates for commune:', commune);
  
  let lat, lng;
  
  if (commune.latitude !== undefined && commune.longitude !== undefined) {
    lat = parseFloat(commune.latitude);
    lng = parseFloat(commune.longitude);
    console.log('📍 Coords from direct properties:', lat, lng);
  }
  
  if (isNaN(lat) || isNaN(lng)) {
    console.warn('📍 Coordonnées invalides, utilisation des valeurs par défaut');
    return [14.7167, -17.4677];
  }
  
  if (lat < 12 || lat > 17 || lng < -18 || lng > -11) {
    console.warn('📍 Coordonnées hors du Sénégal, utilisation des valeurs par défaut');
    return [14.7167, -17.4677];
  }
  
  console.log('📍 Coordonnées valides:', [lat, lng]);
  return [lat, lng];
};

// ============================================================================
// COMPOSANT PRINCIPAL AVEC SYNCHRONISATION
// ============================================================================
const CarteCommunale = ({ 
  ressources, 
  communes, 
  onCommuneSelect, 
  isMobile, 
  formulairePosition, 
  onMapPositionRequest 
}) => {
  const positionDefaut = [14.7167, -17.4677];
  const mapRef = useRef();
  const [cartePrete, setCartePrete] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('osm');
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(positionDefaut);

  // Mettre à jour la position quand formulairePosition change
  useEffect(() => {
    if (formulairePosition && mapRef.current) {
      const { lat, lng } = formulairePosition;
      const newPosition = [lat, lng];
      setCurrentPosition(newPosition);
      mapRef.current.setView(newPosition, 15);
      
      // Ajouter un marqueur temporaire pour la position du formulaire
      if (window.formulaireMarker) {
        mapRef.current.removeLayer(window.formulaireMarker);
      }
      
      window.formulaireMarker = L.marker(newPosition, {
        icon: L.divIcon({
          html: `<div style="background: #ff6b35; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 1.5s infinite;">📌</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(mapRef.current).bindPopup(`
        <div style="padding: 12px; text-align: center; min-width: 200px;">
          <strong style="color: #ff6b35; font-size: 14px;">📍 Position du formulaire</strong><br/>
          <small>Lat: ${lat.toFixed(6)}</small><br/>
          <small>Lng: ${lng.toFixed(6)}</small>
        </div>
      `).openPopup();
    }
  }, [formulairePosition]);

  // Fonction pour obtenir la position actuelle de la carte
  const getCurrentMapPosition = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      return { lat: center.lat, lng: center.lng };
    }
    return null;
  };

  // Gérer les demandes de position depuis le formulaire
  useEffect(() => {
    if (onMapPositionRequest === 'getCurrent') {
      const position = getCurrentMapPosition();
      if (position) {
        // Émettre un événement avec la position actuelle
        window.dispatchEvent(new CustomEvent('mapPositionResponse', { 
          detail: position 
        }));
        console.log('📍 Position carte envoyée:', position);
      }
    }
  }, [onMapPositionRequest]);

  // Écouter les événements de position depuis le formulaire
  useEffect(() => {
    const handleMapPositionRequest = (event) => {
      if (event.detail === 'getCurrent') {
        const position = getCurrentMapPosition();
        if (position) {
          window.dispatchEvent(new CustomEvent('mapPositionResponse', { 
            detail: position 
          }));
        }
      }
    };

    window.addEventListener('mapPositionRequest', handleMapPositionRequest);
    
    return () => {
      window.removeEventListener('mapPositionRequest', handleMapPositionRequest);
    };
  }, []);

  const handleCommuneSelect = async (commune) => {
    console.log('📍 Commune sélectionnée:', commune);
    
    if (!mapRef.current) {
      console.error('❌ Carte non initialisée');
      return;
    }

    try {
      let coordinates = parseCoordinates(commune);
      console.log('📍 Coordonnées calculées:', coordinates);

      if (window.communeMarker) {
        mapRef.current.removeLayer(window.communeMarker);
      }
      if (window.communeBoundaryLayer) {
        mapRef.current.removeLayer(window.communeBoundaryLayer);
      }

      let boundaries = null;
      let communeData = commune;

      if (communeData.id) {
        const apiData = await fetchCommuneBoundaries(communeData.id);
        if (apiData) {
          communeData = { ...communeData, ...apiData };
          boundaries = apiData.geometrie;
          if (apiData.latitude && apiData.longitude) {
            coordinates = [apiData.latitude, apiData.longitude];
            console.log('📍 Coordonnées mises à jour via API:', coordinates);
          }
        }
      }

      if (boundaries) {
        console.log('🎨 Affichage des contours');
        window.communeBoundaryLayer = L.geoJSON(boundaries, {
          style: {
            color: '#00853f',
            weight: 3,
            opacity: 0.8,
            fillColor: '#00853f',
            fillOpacity: 0.15,
            dashArray: '5, 5'
          }
        }).addTo(mapRef.current);
        
        const bounds = window.communeBoundaryLayer.getBounds();
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        console.log('🎯 Vue ajustée aux contours');
      } else {
        console.log('🎯 Centrage sur coordonnées');
        mapRef.current.setView(coordinates, 12);
      }

      window.communeMarker = L.marker(coordinates, {
        icon: L.divIcon({
          html: `<div style="background: #00853f; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏛️</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(mapRef.current).bindPopup(`
        <div style="padding: 12px; text-align: center; min-width: 220px;">
          <strong style="color: #00853f; font-size: 16px;">🏛️ ${communeData.nom}</strong><br/>
          <div style="margin-top: 8px; text-align: left; font-size: 12px;">
            <small><strong>Région:</strong> ${communeData.region || 'Non spécifiée'}</small><br/>
            ${communeData.departement ? `<small><strong>Département:</strong> ${communeData.departement}</small><br/>` : ''}
            ${communeData.chef_lieu ? `<small><strong>Chef-lieu:</strong> ${communeData.chef_lieu}</small><br/>` : ''}
            ${communeData.population ? `<small><strong>Population:</strong> ${communeData.population.toLocaleString()}</small><br/>` : ''}
            ${communeData.superficie_km2 ? `<small><strong>Superficie:</strong> ${communeData.superficie_km2} km²</small><br/>` : ''}
            ${boundaries ? `<small><strong>✅ Contours disponibles</strong></small>` : '<small><strong>❌ Contours non disponibles</strong></small>'}
          </div>
          <button onclick="window.closeCommunePopup()" style="margin-top: 12px; padding: 6px 16px; background: #00853f; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">Fermer</button>
        </div>
      `).openPopup();

      console.log('✅ Commune affichée avec succès');

    } catch (error) {
      console.error('❌ Erreur affichage commune:', error);
    }
    
    if (onCommuneSelect) onCommuneSelect(commune);
  };

  useEffect(() => {
    window.closeCommunePopup = () => { 
      if (window.communeMarker) {
        window.communeMarker.closePopup();
      }
      if (window.communeBoundaryLayer) {
        mapRef.current.removeLayer(window.communeBoundaryLayer);
        window.communeBoundaryLayer = null;
      }
    };
    
    return () => { 
      delete window.closeCommunePopup; 
      delete window.communeBoundaryLayer;
      delete window.communeMarker;
      delete window.formulaireMarker;
    };
  }, []);

  const ressourcesAvecCoordonnees = ressources ? ressources.filter(ressource => {
    const coords = obtenirCoordonnees(ressource);
    return coords && coords[0] !== positionDefaut[0] && coords[1] !== positionDefaut[1];
  }) : [];

  const currentBasemapData = BASEMAPS[currentBasemap] || BASEMAPS.osm;

  return (
    <div className={`carte-container ${isMobile ? 'mobile' : 'desktop'}`} style={{ animation: 'fadeIn 0.8s ease' }}>
      
      <SearchBarCommunes 
        onCommuneSelect={handleCommuneSelect} 
        isMobile={isMobile}
        communesData={communes}
      />
      
      <MapContainer 
        center={positionDefaut} 
        zoom={isMobile ? 10 : 12} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={!isMobile} 
        ref={mapRef} 
        whenReady={() => { 
          console.log('✅ Carte Leaflet prête !'); 
          setCartePrete(true); 
        }}
      >

        <AnalysisToolsBar 
          isMobile={isMobile} 
          ressources={ressourcesAvecCoordonnees} 
        />
        
        <MapController isMobile={isMobile} />
        <BasemapController onBasemapChange={setCurrentBasemap} />
        <LocateControl isMobile={isMobile} />
        <CustomScaleControl isMobile={isMobile} />
        <CoordinatesDisplay isMobile={isMobile} />
        <StatusInfo 
          ressourcesCount={ressourcesAvecCoordonnees.length} 
          selectedCommune={selectedCommune} 
          currentBasemap={currentBasemapData} 
          isMobile={isMobile} 
        />
        <DynamicTileLayer basemap={currentBasemap} />

        {cartePrete && ressourcesAvecCoordonnees.map((ressource) => {
          const coords = obtenirCoordonnees(ressource);
          return (
            <Marker key={ressource.id} position={coords} icon={getIconForRessource(ressource.type)}>
              <Popup>{isMobile ? <MobilePopup ressource={ressource} /> : <DesktopPopup ressource={ressource} />}</Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.2); } 50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(0,0,0,0.3); } 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.2); } }
        @keyframes ripple { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default CarteCommunale;