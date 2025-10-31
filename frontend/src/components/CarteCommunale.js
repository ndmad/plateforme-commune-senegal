import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

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
// COMPOSANT OUTILS D'ANALYSE SIG AVEC BOUTONS FLOTTANTS
// ============================================================================

const FloatingAnalysisTools = ({ isMobile }) => {
  const map = useMap();
  const [activeTool, setActiveTool] = useState(null);
  const [bufferDistance, setBufferDistance] = useState(1);
  const [showDistanceControl, setShowDistanceControl] = useState(false);

  // Références pour les layers
  const layersRef = useRef({
    buffer: null,
    intersection: null,
    density: null,
    measurement: null
  });

  // Nettoyer les layers
  const cleanupLayers = () => {
    Object.values(layersRef.current).forEach(layer => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    
    layersRef.current = {
      buffer: null, intersection: null, density: null, measurement: null
    };
    
    map.off('click');
    map.getContainer().style.cursor = '';
  };

  // Outil BUFFER
  const activateBufferTool = () => {
    if (activeTool === 'buffer') {
      deactivateTools();
      return;
    }
    
    cleanupLayers();
    setActiveTool('buffer');
    setShowDistanceControl(true);

    const handleBufferClick = (e) => {
      const point = turf.point([e.latlng.lng, e.latlng.lat]);
      const buffer = turf.buffer(point, bufferDistance, { units: 'kilometers' });
      
      layersRef.current.buffer = L.geoJSON(buffer, {
        style: {
          color: '#00853f',
          weight: 2,
          opacity: 0.9,
          fillColor: '#00853f',
          fillOpacity: 0.3,
          dashArray: '5, 3'
        }
      }).addTo(map);
      
      const area = (turf.area(buffer) / 1000000).toFixed(2);
      
      layersRef.current.buffer.bindPopup(`
        <div style="padding: 12px; min-width: 200px;">
          <strong>🎯 Zone d'Influence</strong><br>
          <small>Rayon: ${bufferDistance} km</small><br>
          <small>Surface: ${area} km²</small><br>
          <button onclick="window.removeAnalysisLayer('buffer')" style="
            margin-top: 8px; padding: 4px 12px; background: #ff4444; color: white; 
            border: none; border-radius: 4px; cursor: pointer; font-size: 11px;
          ">Supprimer</button>
        </div>
      `).openPopup();
    };

    map.on('click', handleBufferClick);
    map.getContainer().style.cursor = 'crosshair';
    
    window.removeAnalysisLayer = (type) => {
      if (layersRef.current[type] && map.hasLayer(layersRef.current[type])) {
        map.removeLayer(layersRef.current[type]);
        layersRef.current[type] = null;
      }
    };
  };

  // Outil INTERSECTION
  const activateIntersectionTool = () => {
    if (activeTool === 'intersection') {
      deactivateTools();
      return;
    }
    
    cleanupLayers();
    setActiveTool('intersection');
    setShowDistanceControl(false);

    let polygons = [];
    let tempLayers = [];

    const handleIntersectionClick = (e) => {
      const center = [e.latlng.lng, e.latlng.lat];
      const polygon = turf.circle(center, 0.8, { units: 'kilometers' });
      polygons.push(polygon);
      
      const colors = ['#00853f', '#ff4444'];
      const layer = L.geoJSON(polygon, {
        style: {
          color: colors[polygons.length - 1],
          weight: 2,
          opacity: 0.8,
          fillColor: colors[polygons.length - 1],
          fillOpacity: 0.2
        }
      }).addTo(map);
      
      tempLayers.push(layer);

      if (polygons.length === 2) {
        try {
          const intersection = turf.intersect(polygons[0], polygons[1]);
          if (intersection) {
            layersRef.current.intersection = L.geoJSON(intersection, {
              style: {
                color: '#ff9900',
                weight: 3,
                opacity: 1,
                fillColor: '#ff9900',
                fillOpacity: 0.4
              }
            }).addTo(map)
            .bindPopup(`
              <div style="padding: 12px; min-width: 220px;">
                <strong>🔗 Intersection de Zones</strong><br>
                <small>Surface: ${(turf.area(intersection) / 1000000).toFixed(2)} km²</small>
              </div>
            `).openPopup();
          }
        } catch (error) {
          console.error('Erreur intersection:', error);
        }
        
        map.off('click', handleIntersectionClick);
        setActiveTool(null);
        map.getContainer().style.cursor = '';
      }
    };

    map.on('click', handleIntersectionClick);
    map.getContainer().style.cursor = 'crosshair';
  };

  // Outil DENSITÉ
  const activateDensityTool = () => {
    if (activeTool === 'density') {
      deactivateTools();
      return;
    }
    
    cleanupLayers();
    setActiveTool('density');
    setShowDistanceControl(false);

    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    
    const points = turf.randomPoint(30, { bbox: bbox });
    const grid = turf.pointGrid(bbox, 2, { units: 'kilometers' });
    const densityGrid = turf.tag(grid, points, 'density', 'density_values');
    
    layersRef.current.density = L.geoJSON(densityGrid, {
      style: (feature) => {
        const density = feature.properties.density_values ? feature.properties.density_values.length : 0;
        const opacity = Math.min(density * 0.8, 0.7);
        
        return {
          color: '#00853f',
          weight: 1,
          opacity: 0.5,
          fillColor: '#00853f',
          fillOpacity: opacity
        };
      }
    }).addTo(map);
    
    layersRef.current.density.bindPopup(`
      <div style="padding: 12px;">
        <strong>📊 Carte de Densité</strong><br>
        <small>Zones plus foncées = plus de points</small>
      </div>
    `).openPopup();
  };

  // Outil MESURE
  const activateMeasurementTool = () => {
    if (activeTool === 'measurement') {
      deactivateTools();
      return;
    }
    
    cleanupLayers();
    setActiveTool('measurement');
    setShowDistanceControl(false);

    let points = [];
    let polyline = null;
    const markers = [];

    const handleMeasureClick = (e) => {
      const { lat, lng } = e.latlng;
      points.push([lat, lng]);

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `
            <div style="
              background: #00853f; color: white; width: 24px; height: 24px; 
              border-radius: 50%; display: flex; align-items: center; 
              justify-content: center; font-size: 12px; font-weight: bold;
              border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">${points.length}</div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);
      markers.push(marker);

      if (points.length > 1) {
        if (polyline) map.removeLayer(polyline);
        polyline = L.polyline(points, {
          color: '#00853f',
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(map);
        layersRef.current.measurement = polyline;

        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
          const dist = turf.distance(
            turf.point([points[i-1][1], points[i-1][0]]),
            turf.point([points[i][1], points[i][0]]),
            { units: 'kilometers' }
          );
          totalDistance += dist;
        }

        marker.bindPopup(`
          <div style="padding: 12px;">
            <strong>📏 Mesure de Distance</strong><br>
            <small>Distance totale: ${totalDistance.toFixed(2)} km</small><br>
            <small>Points: ${points.length}</small>
          </div>
        `).openPopup();
      }
    };

    map.on('click', handleMeasureClick);
    map.getContainer().style.cursor = 'crosshair';
  };

  // Désactiver tous les outils
  const deactivateTools = () => {
    cleanupLayers();
    setActiveTool(null);
    setShowDistanceControl(false);
  };

  // Nettoyer à la destruction
  useEffect(() => {
    return () => {
      cleanupLayers();
    };
  }, [map]);

  return (
    <>
      {/* BOUTON FLOTTANT BUFFER */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '80px' : '80px',
        right: '10px',
        zIndex: 1000
      }}>
        <FloatingToolButton 
          active={activeTool === 'buffer'}
          icon="🎯"
          title="Zone d'influence (Buffer)"
          onClick={activateBufferTool}
          isMobile={isMobile}
        />
      </div>

      {/* BOUTON FLOTTANT INTERSECTION */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '140px' : '140px',
        right: '10px',
        zIndex: 1000
      }}>
        <FloatingToolButton 
          active={activeTool === 'intersection'}
          icon="🔗"
          title="Intersection de zones"
          onClick={activateIntersectionTool}
          isMobile={isMobile}
        />
      </div>

      {/* BOUTON FLOTTANT DENSITÉ */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '200px' : '200px',
        right: '10px',
        zIndex: 1000
      }}>
        <FloatingToolButton 
          active={activeTool === 'density'}
          icon="📊"
          title="Carte de densité"
          onClick={activateDensityTool}
          isMobile={isMobile}
        />
      </div>

      {/* BOUTON FLOTTANT MESURE */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '260px' : '260px',
        right: '10px',
        zIndex: 1000
      }}>
        <FloatingToolButton 
          active={activeTool === 'measurement'}
          icon="📏"
          title="Mesure de distance"
          onClick={activateMeasurementTool}
          isMobile={isMobile}
        />
      </div>

      {/* BOUTON FLOTTANT EFFACER */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '320px' : '320px',
        right: '10px',
        zIndex: 1000
      }}>
        <FloatingToolButton 
          active={false}
          icon="🗑️"
          title="Effacer tout"
          onClick={deactivateTools}
          isMobile={isMobile}
          color="#ff4444"
        />
      </div>

      {/* CONTRÔLE DE DISTANCE (apparaît seulement pour le buffer) */}
      {showDistanceControl && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '80px' : '80px',
          right: isMobile ? '70px' : '70px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '160px',
          animation: 'slideInRight 0.3s ease'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            📏 Rayon: {bufferDistance} km
          </div>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={bufferDistance}
            onChange={(e) => setBufferDistance(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #00853f, #00a651)',
              outline: 'none'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#666',
            marginTop: '4px'
          }}>
            <span>0.1 km</span>
            <span>10 km</span>
          </div>
        </div>
      )}
    </>
  );
};

// Composant bouton flottant individuel
const FloatingToolButton = ({ active, icon, title, onClick, isMobile, color = '#00853f' }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: isMobile ? '50px' : '45px',
      height: isMobile ? '50px' : '45px',
      borderRadius: '50%',
      background: active ? color : 'white',
      color: active ? 'white' : color,
      border: `2px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isMobile ? '18px' : '16px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease',
      animation: active ? 'pulse 2s infinite' : 'none'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.target.style.background = color;
        e.target.style.color = 'white';
        e.target.style.transform = 'scale(1.1)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.target.style.background = 'white';
        e.target.style.color = color;
        e.target.style.transform = 'scale(1)';
      }
    }}
  >
    {icon}
  </button>
);

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
const fetchCommuneBoundaries = async (communeId) => {
  try {
    console.log(`📍 Récupération des contours pour la commune ID: ${communeId}`);
    const response = await fetch(`${API_BASE_URL}/communes/${communeId}/contours`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ Contours reçus pour:', result.data.nom);
      return result.data;
    } else {
      throw new Error(result.error || 'Erreur inconnue');
    }
  } catch (error) {
    console.error('❌ Erreur récupération contours:', error);
    return null;
  }
};

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
      // Essayer d'abord avec les données locales (fallback)
      const localResults = communesData.filter(commune =>
        commune.nom.toLowerCase().includes(term.toLowerCase()) || 
        (commune.region && commune.region.toLowerCase().includes(term.toLowerCase()))
      ).slice(0, 8);
      
      setResults(localResults);
      setShowResults(true);
      
      console.log(`🔍 Recherche locale: ${localResults.length} résultats pour "${term}"`);
      
      // En parallèle, essayer l'API mais ne pas attendre
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
    
    // AJOUTER L'INDICATEUR DE CHARGEMENT
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
      // En cas d'erreur, remettre le nom de la commune
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
// Fonction pour valider et parser les coordonnées
const parseCoordinates = (commune) => {
  console.log('📍 Parsing coordinates for commune:', commune);
  
  let lat, lng;
  
  // Source 1: Propriétés directes latitude/longitude
  if (commune.latitude !== undefined && commune.longitude !== undefined) {
    lat = parseFloat(commune.latitude);
    lng = parseFloat(commune.longitude);
    console.log('📍 Coords from direct properties:', lat, lng);
  }
  
  // Source 2: Vérifier si ce sont des nombres valides
  if (isNaN(lat) || isNaN(lng)) {
    console.warn('📍 Coordonnées invalides, utilisation des valeurs par défaut');
    return [14.7167, -17.4677]; // Dakar par défaut
  }
  
  // Vérifier que les coordonnées sont dans des plages raisonnables pour le Sénégal
  if (lat < 12 || lat > 17 || lng < -18 || lng > -11) {
    console.warn('📍 Coordonnées hors du Sénégal, utilisation des valeurs par défaut');
    return [14.7167, -17.4677];
  }
  
  console.log('📍 Coordonnées valides:', [lat, lng]);
  return [lat, lng];
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const CarteCommunale = ({ ressources, communes, onCommuneSelect, isMobile }) => {
  const positionDefaut = [14.7167, -17.4677];
  const mapRef = useRef();
  const [cartePrete, setCartePrete] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('osm');
  const [selectedCommune, setSelectedCommune] = useState(null);

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

        <FloatingAnalysisTools isMobile={isMobile} />
        
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