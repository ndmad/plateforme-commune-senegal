import React, { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

const AnalysisToolsBar = ({ isMobile }) => {
  const map = useMap(); // ✅ CORRECT - utilisation du hook useMap
  const [activeTool, setActiveTool] = useState(null);
  const [bufferDistance, setBufferDistance] = useState(1); // km
  
  // Références pour les layers
  const bufferLayerRef = useRef(null);
  const intersectionLayerRef = useRef(null);
  const densityLayerRef = useRef(null);
  const proximityLayerRef = useRef(null);
  const polygonsRef = useRef([]);

  // Nettoyer les layers
  const cleanupLayers = () => {
    [bufferLayerRef, intersectionLayerRef, densityLayerRef, proximityLayerRef].forEach(ref => {
      if (ref.current && map.hasLayer(ref.current)) {
        map.removeLayer(ref.current);
        ref.current = null;
      }
    });
    
    // Nettoyer les polygones d'intersection
    polygonsRef.current.forEach(layer => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    polygonsRef.current = [];
    
    // Nettoyer les événements
    map.off('click');
    map.getContainer().style.cursor = '';
  };

  // Désactiver tous les outils
  const deactivateTools = () => {
    cleanupLayers();
    setActiveTool(null);
  };

  // Nettoyer à la destruction
  useEffect(() => {
    return () => {
      cleanupLayers();
    };
  }, [map]);

  // Outil BUFFER (zone d'influence)
  const activateBufferTool = () => {
    deactivateTools();
    setActiveTool('buffer');
    
    const handleBufferClick = (e) => {
      const point = turf.point([e.latlng.lng, e.latlng.lat]);
      const buffer = turf.buffer(point, bufferDistance, { units: 'kilometers' });
      
      // Créer le layer buffer
      bufferLayerRef.current = L.geoJSON(buffer, {
        style: {
          color: '#00853f',
          weight: 2,
          opacity: 0.8,
          fillColor: '#00853f',
          fillOpacity: 0.3
        }
      }).addTo(map);
      
      // Ajouter un popup avec les infos
      bufferLayerRef.current.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong>🗺️ Zone d'influence (Buffer)</strong><br>
          <strong>Distance:</strong> ${bufferDistance} km<br>
          <strong>Surface:</strong> ${(turf.area(buffer) / 1000000).toFixed(2)} km²<br>
          <button onclick="window.removeBuffer()" style="
            margin-top: 8px;
            padding: 4px 12px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Supprimer</button>
        </div>
      `).openPopup();

      // Exposer la fonction de suppression
      window.removeBuffer = () => {
        if (bufferLayerRef.current && map.hasLayer(bufferLayerRef.current)) {
          map.removeLayer(bufferLayerRef.current);
          bufferLayerRef.current = null;
        }
      };
    };

    map.on('click', handleBufferClick);
    map.getContainer().style.cursor = 'crosshair';
  };

  // Outil INTERSECTION
  const activateIntersectionTool = () => {
    deactivateTools();
    setActiveTool('intersection');
    
    let polygons = [];
    let clickCount = 0;

    const handleIntersectionClick = (e) => {
      if (clickCount === 0) {
        // Premier polygone
        const center = [e.latlng.lng, e.latlng.lat];
        const polygon1 = turf.circle(center, 0.5, { units: 'kilometers' });
        
        polygons.push(polygon1);
        
        // Afficher le premier polygone
        const layer1 = L.geoJSON(polygon1, {
          style: {
            color: '#00853f',
            weight: 2,
            opacity: 0.8,
            fillColor: '#00853f',
            fillOpacity: 0.3
          }
        }).addTo(map);
        polygonsRef.current.push(layer1);
        
        clickCount++;
        
      } else if (clickCount === 1) {
        // Deuxième polygone
        const center = [e.latlng.lng, e.latlng.lat];
        const polygon2 = turf.circle(center, 0.5, { units: 'kilometers' });
        
        polygons.push(polygon2);
        
        // Afficher le deuxième polygone
        const layer2 = L.geoJSON(polygon2, {
          style: {
            color: '#ff4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ff4444',
            fillOpacity: 0.3
          }
        }).addTo(map);
        polygonsRef.current.push(layer2);
        
        // Calculer l'intersection
        try {
          const intersection = turf.intersect(polygons[0], polygons[1]);
          
          if (intersection) {
            // Afficher l'intersection
            intersectionLayerRef.current = L.geoJSON(intersection, {
              style: {
                color: '#ff9900',
                weight: 3,
                opacity: 1,
                fillColor: '#ff9900',
                fillOpacity: 0.5
              }
            }).addTo(map)
            .bindPopup(`
              <div style="text-align: center; padding: 8px;">
                <strong>🔗 Zone d'intersection</strong><br>
                <strong>Surface:</strong> ${(turf.area(intersection) / 1000000).toFixed(2)} km²<br>
                <small>Vert + Rouge = Orange (intersection)</small>
              </div>
            `).openPopup();
          } else {
            L.popup()
              .setLatLng(e.latlng)
              .setContent('<div style="padding: 8px; text-align: center;">❌ Pas d\'intersection détectée</div>')
              .openOn(map);
          }
        } catch (error) {
          console.error('Erreur intersection:', error);
          L.popup()
            .setLatLng(e.latlng)
            .setContent('<div style="padding: 8px; text-align: center;">❌ Erreur lors du calcul</div>')
            .openOn(map);
        }
        
        // Réinitialiser
        map.off('click', handleIntersectionClick);
        setActiveTool(null);
        map.getContainer().style.cursor = '';
      }
    };

    map.on('click', handleIntersectionClick);
    map.getContainer().style.cursor = 'crosshair';
  };

  // Outil DENSITÉ (heatmap simple)
  const activateDensityTool = () => {
    deactivateTools();
    setActiveTool('density');
    
    // Simuler des points de données dans les bounds actuelles
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    
    const points = turf.randomPoint(30, { bbox: bbox });
    
    // Créer une grille de densité
    const grid = turf.pointGrid(bbox, 2, { units: 'kilometers' });
    
    // Calculer la densité (simplifié)
    const densityGrid = turf.tag(grid, points, 'density', 'density');
    
    // Afficher la grille de densité
    densityLayerRef.current = L.geoJSON(densityGrid, {
      style: (feature) => {
        const density = feature.properties.density || 0;
        const opacity = Math.min(density * 0.8, 0.7);
        
        return {
          color: '#00853f',
          weight: 1,
          opacity: 0.5,
          fillColor: '#00853f',
          fillOpacity: opacity
        };
      },
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: '#00853f',
          color: '#00853f',
          weight: 1,
          opacity: 0.7,
          fillOpacity: 0.5
        });
      }
    }).addTo(map);
    
    densityLayerRef.current.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong>📊 Carte de densité</strong><br>
        <small>Zones plus foncées = plus de points</small><br>
        <button onclick="window.removeDensity()" style="
          margin-top: 8px;
          padding: 4px 12px;
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Supprimer</button>
      </div>
    `).openPopup();
    
    window.removeDensity = () => {
      if (densityLayerRef.current && map.hasLayer(densityLayerRef.current)) {
        map.removeLayer(densityLayerRef.current);
        densityLayerRef.current = null;
      }
    };
  };

  // Outil PROXIMITÉ (recherche dans un rayon)
  const activateProximityTool = () => {
    deactivateTools();
    setActiveTool('proximity');
    
    const handleProximityClick = (e) => {
      const center = [e.latlng.lng, e.latlng.lat];
      const buffer = turf.buffer(turf.point(center), bufferDistance, { units: 'kilometers' });
      
      // Afficher la zone de proximité
      proximityLayerRef.current = L.geoJSON(buffer, {
        style: {
          color: '#00853f',
          weight: 2,
          opacity: 0.8,
          fillColor: '#00853f',
          fillOpacity: 0.2
        }
      }).addTo(map);
      
      proximityLayerRef.current.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong>🎯 Zone de proximité</strong><br>
          <strong>Rayon:</strong> ${bufferDistance} km<br>
          <strong>Surface:</strong> ${(turf.area(buffer) / 1000000).toFixed(2)} km²<br>
          <small>Analyse des ressources dans cette zone</small><br>
          <button onclick="window.removeProximity()" style="
            margin-top: 8px;
            padding: 4px 12px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Supprimer</button>
        </div>
      `).openPopup();
      
      window.removeProximity = () => {
        if (proximityLayerRef.current && map.hasLayer(proximityLayerRef.current)) {
          map.removeLayer(proximityLayerRef.current);
          proximityLayerRef.current = null;
        }
      };
    };

    map.on('click', handleProximityClick);
    map.getContainer().style.cursor = 'crosshair';
  };

  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? '120px' : '80px', // ⬅️ POSITION CORRIGÉE (plus bas)
      right: '10px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      animation: 'slideInRight 0.5s ease'
    }}>
      
      {/* Contrôle de distance pour le buffer */}
      {activeTool && (activeTool === 'buffer' || activeTool === 'proximity') && (
        <div style={{
          background: 'white',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          marginBottom: '8px',
          minWidth: '120px'
        }}>
          <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>
            📏 {bufferDistance} km
          </label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={bufferDistance}
            onChange={(e) => setBufferDistance(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* Outil Buffer */}
      <button
        onClick={activeTool === 'buffer' ? deactivateTools : activateBufferTool}
        title="Créer une zone d'influence (Buffer)"
        style={{
          width: isMobile ? '50px' : '45px',
          height: isMobile ? '50px' : '45px',
          borderRadius: '50%',
          border: `2px solid ${activeTool === 'buffer' ? '#00853f' : '#00853f'}`,
          background: activeTool === 'buffer' ? '#00853f' : 'white',
          color: activeTool === 'buffer' ? 'white' : '#00853f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '18px' : '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        🎯
      </button>

      {/* Outil Intersection */}
      <button
        onClick={activeTool === 'intersection' ? deactivateTools : activateIntersectionTool}
        title="Analyser l'intersection entre zones"
        style={{
          width: isMobile ? '50px' : '45px',
          height: isMobile ? '50px' : '45px',
          borderRadius: '50%',
          border: `2px solid ${activeTool === 'intersection' ? '#ff9900' : '#ff9900'}`,
          background: activeTool === 'intersection' ? '#ff9900' : 'white',
          color: activeTool === 'intersection' ? 'white' : '#ff9900',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '18px' : '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        🔗
      </button>

      {/* Outil Densité */}
      <button
        onClick={activeTool === 'density' ? deactivateTools : activateDensityTool}
        title="Analyser la densité des ressources"
        style={{
          width: isMobile ? '50px' : '45px',
          height: isMobile ? '50px' : '45px',
          borderRadius: '50%',
          border: `2px solid ${activeTool === 'density' ? '#00853f' : '#00853f'}`,
          background: activeTool === 'density' ? '#00853f' : 'white',
          color: activeTool === 'density' ? 'white' : '#00853f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '18px' : '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        📊
      </button>

      {/* Outil Proximité */}
      <button
        onClick={activeTool === 'proximity' ? deactivateTools : activateProximityTool}
        title="Analyser les ressources à proximité"
        style={{
          width: isMobile ? '50px' : '45px',
          height: isMobile ? '50px' : '45px',
          borderRadius: '50%',
          border: `2px solid ${activeTool === 'proximity' ? '#00853f' : '#00853f'}`,
          background: activeTool === 'proximity' ? '#00853f' : 'white',
          color: activeTool === 'proximity' ? 'white' : '#00853f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '18px' : '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        📍
      </button>

      {/* Bouton Reset */}
      <button
        onClick={deactivateTools}
        title="Réinitialiser tous les outils"
        style={{
          width: isMobile ? '50px' : '45px',
          height: isMobile ? '50px' : '45px',
          borderRadius: '50%',
          border: '2px solid #dc2626',
          background: '#dc2626',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '18px' : '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        🗑️
      </button>

    </div>
  );
};

export default AnalysisToolsBar;