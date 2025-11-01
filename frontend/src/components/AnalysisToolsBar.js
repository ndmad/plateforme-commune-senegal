import React, { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

const AnalysisToolsBar = ({ isMobile, ressources = [] }) => {
  const map = useMap();
  const [activeTool, setActiveTool] = useState(null);
  const [bufferDistance, setBufferDistance] = useState(1);
  
  // Références unifiées
  const layersRef = useRef({
    buffer: null,
    intersection: null,
    density: null,
    measurement: null,
    polygons: [],
    tempLayers: [] // Pour les layers temporaires
  });

  // Nettoyage amélioré - CORRIGÉ
  const cleanupLayers = () => {
    console.log('🧹 Nettoyage des layers...');
    
    // Nettoyer tous les layers du map
    map.eachLayer((layer) => {
      // Garder seulement les layers de base (tiles)
      if (!layer._url && !layer._isTileLayer) {
        // Vérifier si c'est un layer temporaire ou d'analyse
        if (layer instanceof L.Marker || 
            layer instanceof L.Polygon || 
            layer instanceof L.Polyline ||
            layer instanceof L.GeoJSON) {
          map.removeLayer(layer);
        }
      }
    });
    
    // Réinitialiser les références
    layersRef.current = {
      buffer: null,
      intersection: null,
      density: null,
      measurement: null,
      polygons: [],
      tempLayers: []
    };
    
    // Nettoyer les événements
    map.off('click');
    map.off('dblclick');
    map.getContainer().style.cursor = '';
    
    // Nettoyer les fonctions globales
    ['removeBuffer', 'removeIntersection', 'removeDensity', 'removeMeasurement', 'closeCommunePopup'].forEach(fn => {
      delete window[fn];
    });
    
    console.log('✅ Nettoyage terminé');
  };

  const deactivateTools = () => {
    console.log('🔴 Désactivation des outils');
    cleanupLayers();
    setActiveTool(null);
  };

  useEffect(() => {
    return () => {
      cleanupLayers();
    };
  }, [map]);

  // Effet pour mettre à jour le buffer en temps réel quand la distance change
  useEffect(() => {
    if (activeTool === 'buffer' && layersRef.current.buffer) {
      // Recréer le buffer avec la nouvelle distance
      const geoJSON = layersRef.current.buffer.toGeoJSON();
      if (geoJSON.features && geoJSON.features.length > 0) {
        const currentCenter = turf.center(geoJSON);
        const newBuffer = turf.buffer(currentCenter, bufferDistance, { units: 'kilometers' });
        
        // Supprimer l'ancien buffer
        map.removeLayer(layersRef.current.buffer);
        
        // Créer le nouveau buffer
        layersRef.current.buffer = L.geoJSON(newBuffer, {
          style: {
            color: '#00853f',
            weight: 3,
            opacity: 0.9,
            fillColor: '#00853f',
            fillOpacity: 0.2,
            dashArray: '5, 5'
          }
        }).addTo(map);
        
        // Mettre à jour le popup
        const resourcesInBuffer = ressources.filter(ressource => {
          try {
            const coords = obtenirCoordonnees(ressource);
            const resourcePoint = turf.point([coords[1], coords[0]]);
            return turf.booleanPointInPolygon(resourcePoint, newBuffer);
          } catch (error) {
            return false;
          }
        });
        
        const area = (turf.area(newBuffer) / 1000000).toFixed(2);
        
        layersRef.current.buffer.bindPopup(`
          <div style="text-align: center; padding: 12px; min-width: 200px;">
            <strong>🎯 Zone d'Influence</strong><br>
            <small>Rayon: ${bufferDistance} km</small><br>
            <small>Surface: ${area} km²</small><br>
            <small>Ressources: ${resourcesInBuffer.length}</small><br>
            <button onclick="window.removeBuffer()" style="
              margin-top: 8px; padding: 6px 12px; background: #ff4444; color: white; 
              border: none; border-radius: 6px; cursor: pointer; font-size: 12px;
            ">Supprimer</button>
          </div>
        `).openPopup();
      }
    }
  }, [bufferDistance, activeTool, map, ressources]);

  // 🎯 OUTIL BUFFER CORRIGÉ - Mise à jour au lieu de création
  const activateBufferTool = () => {
    deactivateTools();
    setActiveTool('buffer');
    
    console.log('🎯 Activation outil Buffer');
    
    let currentBufferLayer = null;

    const handleBufferClick = (e) => {
      // Supprimer l'ancien buffer s'il existe
      if (currentBufferLayer) {
        map.removeLayer(currentBufferLayer);
        currentBufferLayer = null;
      }
      
      const point = turf.point([e.latlng.lng, e.latlng.lat]);
      const buffer = turf.buffer(point, bufferDistance, { units: 'kilometers' });
      
      // Compter les ressources dans le buffer
      const resourcesInBuffer = ressources.filter(ressource => {
        try {
          const coords = obtenirCoordonnees(ressource);
          const resourcePoint = turf.point([coords[1], coords[0]]);
          return turf.booleanPointInPolygon(resourcePoint, buffer);
        } catch (error) {
          return false;
        }
      });

      // Créer le nouveau buffer
      currentBufferLayer = L.geoJSON(buffer, {
        style: {
          color: '#00853f',
          weight: 3,
          opacity: 0.9,
          fillColor: '#00853f',
          fillOpacity: 0.2,
          dashArray: '5, 5'
        }
      }).addTo(map);
      
      const area = (turf.area(buffer) / 1000000).toFixed(2);
      
      currentBufferLayer.bindPopup(`
        <div style="text-align: center; padding: 12px; min-width: 200px;">
          <strong>🎯 Zone d'Influence</strong><br>
          <small>Rayon: ${bufferDistance} km</small><br>
          <small>Surface: ${area} km²</small><br>
          <small>Ressources: ${resourcesInBuffer.length}</small><br>
          <button onclick="window.removeBuffer()" style="
            margin-top: 8px; padding: 6px 12px; background: #ff4444; color: white; 
            border: none; border-radius: 6px; cursor: pointer; font-size: 12px;
          ">Supprimer</button>
        </div>
      `).openPopup();

      // Stocker la référence
      layersRef.current.buffer = currentBufferLayer;

      window.removeBuffer = () => {
        if (currentBufferLayer) {
          map.removeLayer(currentBufferLayer);
          currentBufferLayer = null;
          layersRef.current.buffer = null;
        }
      };
    };

    map.on('click', handleBufferClick);
    map.getContainer().style.cursor = 'crosshair';
  };

  // 🔗 OUTIL INTERSECTION CORRIGÉ
  const activateIntersectionTool = () => {
    deactivateTools();
    setActiveTool('intersection');
    
    let polygons = [];
    let clickCount = 0;

    const handleIntersectionClick = (e) => {
      if (clickCount === 0) {
        // Premier polygone
        const center = [e.latlng.lng, e.latlng.lat];
        const polygon1 = turf.circle(center, bufferDistance, { units: 'kilometers' });
        polygons.push(polygon1);
        
        const layer1 = L.geoJSON(polygon1, {
          style: {
            color: '#00853f',
            weight: 2,
            opacity: 0.8,
            fillColor: '#00853f',
            fillOpacity: 0.2
          }
        }).addTo(map);
        
        layersRef.current.tempLayers.push(layer1);
        clickCount++;
        
        L.popup()
          .setLatLng(e.latlng)
          .setContent('<div style="padding: 8px; text-align: center;">✅ Premier polygone<br>Cliquez pour le deuxième</div>')
          .openOn(map);

      } else if (clickCount === 1) {
        // Deuxième polygone
        const center = [e.latlng.lng, e.latlng.lat];
        const polygon2 = turf.circle(center, bufferDistance, { units: 'kilometers' });
        polygons.push(polygon2);
        
        const layer2 = L.geoJSON(polygon2, {
          style: {
            color: '#ff4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ff4444',
            fillOpacity: 0.2
          }
        }).addTo(map);
        
        layersRef.current.tempLayers.push(layer2);

        // Calculer l'intersection
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
              <div style="padding: 12px; text-align: center; min-width: 220px;">
                <strong>🔗 Intersection de Zones</strong><br>
                <small>Surface: ${(turf.area(intersection) / 1000000).toFixed(2)} km²</small><br>
                <button onclick="window.removeIntersection()" style="
                  margin-top: 8px; padding: 6px 12px; background: #ff4444; color: white; 
                  border: none; border-radius: 6px; cursor: pointer; font-size: 12px;
                ">Supprimer</button>
              </div>
            `).openPopup();

            window.removeIntersection = () => {
              if (layersRef.current.intersection) {
                map.removeLayer(layersRef.current.intersection);
                layersRef.current.intersection = null;
              }
              layersRef.current.tempLayers.forEach(layer => {
                if (layer && map.hasLayer(layer)) map.removeLayer(layer);
              });
              layersRef.current.tempLayers = [];
            };
          } else {
            L.popup()
              .setLatLng(e.latlng)
              .setContent('<div style="padding: 12px; text-align: center;">❌ Pas d\'intersection détectée</div>')
              .openOn(map);
          }
        } catch (error) {
          console.error('Erreur intersection:', error);
          L.popup()
            .setLatLng(e.latlng)
            .setContent('<div style="padding: 12px; text-align: center;">❌ Erreur lors du calcul</div>')
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

  // 📊 OUTIL DENSITÉ CORRIGÉ - Sans points simulés, uniquement les vraies ressources
  const activateDensityTool = () => {
    deactivateTools();
    setActiveTool('density');

    if (ressources.length === 0) {
      L.popup()
        .setLatLng(map.getCenter())
        .setContent('<div style="padding: 12px; text-align: center;">❌ Aucune ressource à analyser</div>')
        .openOn(map);
      return;
    }

    console.log(`📊 Analyse de densité sur ${ressources.length} ressources`);

    // Créer des points uniquement pour les vraies ressources
    const resourcePoints = ressources.map(ressource => {
      try {
        const coords = obtenirCoordonnees(ressource);
        return turf.point([coords[1], coords[0]], {
          type: ressource.type,
          nom: ressource.nom
        });
      } catch (error) {
        return null;
      }
    }).filter(point => point !== null);

    if (resourcePoints.length === 0) {
      L.popup()
        .setLatLng(map.getCenter())
        .setContent('<div style="padding: 12px; text-align: center;">❌ Aucune ressource avec coordonnées valides</div>')
        .openOn(map);
      return;
    }

    const pointsCollection = turf.featureCollection(resourcePoints);
    
    // Créer une heatmap basée sur la densité des points réels
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    
    // Créer une grille pour l'analyse de densité
    const gridSize = isMobile ? 8 : 5; // km entre les points de grille
    const grid = turf.pointGrid(bbox, gridSize, { units: 'kilometers' });
    
    // Pour chaque cellule de grille, compter les ressources à proximité
    const densityGrid = turf.featureCollection(
      grid.features.map(cell => {
        const cellCenter = turf.center(cell);
        let resourcesCount = 0;
        
        // Compter les ressources dans un rayon autour de la cellule
        resourcePoints.forEach(point => {
          const distance = turf.distance(cellCenter, point, { units: 'kilometers' });
          if (distance <= gridSize / 2) {
            resourcesCount++;
          }
        });
        
        return turf.feature(cell.geometry, {
          density: resourcesCount,
          count: resourcesCount
        });
      })
    );

    // Afficher la grille de densité
    layersRef.current.density = L.geoJSON(densityGrid, {
      style: (feature) => {
        const density = feature.properties.density || 0;
        let color = '#e5e7eb'; // Gris par défaut (faible densité)
        let opacity = 0.1;

        if (density > 0) {
          // Échelle de couleur basée sur la densité
          if (density >= 5) {
            color = '#dc2626'; // Rouge (forte densité)
            opacity = 0.7;
          } else if (density >= 3) {
            color = '#f59e0b'; // Orange (densité moyenne)
            opacity = 0.5;
          } else if (density >= 1) {
            color = '#00853f'; // Vert (faible densité)
            opacity = 0.3;
          }
        }

        return {
          color: color,
          weight: 1,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: opacity
        };
      }
    }).addTo(map);
    
    // Ajouter aussi les marqueurs des vraies ressources pour référence
    const actualMarkers = L.layerGroup(
      resourcePoints.map(point => {
        return L.marker([point.geometry.coordinates[1], point.geometry.coordinates[0]], {
          icon: L.divIcon({
            html: `<div style="background: #00853f; color: white; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4]
          })
        });
      })
    ).addTo(map);
    
    layersRef.current.tempLayers.push(actualMarkers);
    
    layersRef.current.density.bindPopup(`
      <div style="padding: 12px; text-align: center; min-width: 250px;">
        <strong>📊 Carte de Densité des Ressources</strong><br>
        <small>${resourcePoints.length} ressources analysées</small><br>
        <small>🟢 Faible densité | 🟠 Moyenne | 🔴 Forte densité</small><br>
        <small>Grille: ${gridSize} km entre les points</small><br>
        <button onclick="window.removeDensity()" style="
          margin-top: 8px; padding: 6px 12px; background: #ff4444; color: white; 
          border: none; border-radius: 6px; cursor: pointer; font-size: 12px;
        ">Supprimer</button>
      </div>
    `).openPopup();
    
    window.removeDensity = () => {
      if (layersRef.current.density) {
        map.removeLayer(layersRef.current.density);
        layersRef.current.density = null;
      }
      layersRef.current.tempLayers.forEach(layer => {
        if (layer && map.hasLayer(layer)) map.removeLayer(layer);
      });
      layersRef.current.tempLayers = [];
    };
  };

  // 📏 OUTIL MESURE DE DISTANCE CORRIGÉ
  const activateMeasurementTool = () => {
    deactivateTools();
    setActiveTool('measurement');
    
    let points = [];
    let polyline = null;

    const handleMeasureClick = (e) => {
      points.push([e.latlng.lat, e.latlng.lng]);

      // Marqueur avec numéro
      const marker = L.marker(e.latlng, {
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

      layersRef.current.polygons.push(marker);

      if (points.length > 1) {
        if (polyline) map.removeLayer(polyline);
        
        polyline = L.polyline(points.map(p => [p[0], p[1]]), {
          color: '#00853f',
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(map);
        
        layersRef.current.measurement = polyline;

        // Calcul de la distance totale
        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
          const from = turf.point([points[i-1][1], points[i-1][0]]);
          const to = turf.point([points[i][1], points[i][0]]);
          totalDistance += turf.distance(from, to, { units: 'kilometers' });
        }

        marker.bindPopup(`
          <div style="padding: 12px; text-align: center;">
            <strong>📏 Mesure de Distance</strong><br>
            <small>Distance totale: ${totalDistance.toFixed(2)} km</small><br>
            <small>Points: ${points.length}</small><br>
            <small>Double-cliquez pour terminer</small><br>
            <button onclick="window.removeMeasurement()" style="
              margin-top: 8px; padding: 6px 12px; background: #ff4444; color: white; 
              border: none; border-radius: 6px; cursor: pointer; font-size: 12px;
            ">Nouvelle mesure</button>
          </div>
        `).openPopup();

        window.removeMeasurement = () => {
          deactivateTools();
        };
      }

      // Double-clic pour terminer
      if (points.length >= 2) {
        const handleDblClick = () => {
          map.off('click', handleMeasureClick);
          map.off('dblclick', handleDblClick);
          setActiveTool(null);
          map.getContainer().style.cursor = '';
        };
        map.once('dblclick', handleDblClick);
      }
    };

    map.on('click', handleMeasureClick);
    map.getContainer().style.cursor = 'crosshair';
  };

  // Fonction utilitaire pour les coordonnées
  const obtenirCoordonnees = (ressource) => {
    if (ressource.localisation && ressource.localisation.coordinates) {
      const [lng, lat] = ressource.localisation.coordinates;
      return [lat, lng];
    }
    if (ressource.latitude && ressource.longitude) {
      return [parseFloat(ressource.latitude), parseFloat(ressource.longitude)];
    }
    return [14.7167, -17.4677];
  };

  const tools = [
    { id: 'buffer', icon: '🎯', title: 'Zone d\'influence (Buffer)', action: activateBufferTool, color: '#00853f' },
    { id: 'intersection', icon: '🔗', title: 'Intersection de zones', action: activateIntersectionTool, color: '#ff9900' },
    { id: 'density', icon: '📊', title: 'Carte de densité', action: activateDensityTool, color: '#00853f' },
    { id: 'measurement', icon: '📏', title: 'Mesure de distance', action: activateMeasurementTool, color: '#3b82f6' },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? '120px' : '80px',
      right: '10px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      
      {/* Contrôle de distance - CORRIGÉ pour mise à jour en temps réel */}
      {(activeTool === 'buffer' || activeTool === 'intersection') && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '12px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '160px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
            📏 Rayon: {bufferDistance} km
          </div>
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={bufferDistance}
            onChange={(e) => setBufferDistance(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginTop: '4px' }}>
            <span>0.1 km</span>
            <span>20 km</span>
          </div>
        </div>
      )}

      {/* Boutons des outils */}
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={activeTool === tool.id ? deactivateTools : tool.action}
          title={tool.title}
          style={{
            width: isMobile ? '50px' : '45px',
            height: isMobile ? '50px' : '45px',
            borderRadius: '50%',
            border: `2px solid ${tool.color}`,
            background: activeTool === tool.id ? tool.color : 'white',
            color: activeTool === tool.id ? 'white' : tool.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '18px' : '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            animation: activeTool === tool.id ? 'pulse 2s infinite' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTool !== tool.id) {
              e.target.style.background = tool.color;
              e.target.style.color = 'white';
              e.target.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTool !== tool.id) {
              e.target.style.background = 'white';
              e.target.style.color = tool.color;
              e.target.style.transform = 'scale(1)';
            }
          }}
        >
          {tool.icon}
        </button>
      ))}

      {/* Bouton Reset - MAINTENANT FONCTIONNEL */}
      <button
        onClick={() => {
          console.log('🔄 Reset demandé');
          deactivateTools();
          // Forcer un refresh visuel
          map.invalidateSize();
        }}
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
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#b91c1c';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#dc2626';
          e.target.style.transform = 'scale(1)';
        }}
      >
        🗑️
      </button>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
          50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
          100% { transform: scale(1); boxShadow: 0 4px 15px rgba(0,0,0,0.2); }
        }
      `}</style>
    </div>
  );
};

export default AnalysisToolsBar;