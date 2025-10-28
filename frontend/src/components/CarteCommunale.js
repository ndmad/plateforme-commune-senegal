import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { communesSenegal } from '../data/communesSenegal';

// Correction CRITIQUE des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// COMPOSANT COORDONNÉES EN TEMPS RÉEL (STYLE LEAFLET)
const CoordinatesDisplay = ({ isMobile }) => {
  const map = useMap();
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    const updateCoordinates = (e) => {
      const point = e.latlng || map.getCenter();
      setCoordinates({
        lat: point.lat.toFixed(6),
        lng: point.lng.toFixed(6)
      });
    };

    // Mettre à jour avec la position actuelle
    updateCoordinates({ latlng: map.getCenter() });

    // Écouter les mouvements de la souris et de la carte
    map.on('mousemove', updateCoordinates);
    map.on('move', () => updateCoordinates({ latlng: map.getCenter() }));

    return () => {
      map.off('mousemove', updateCoordinates);
      map.off('move', () => updateCoordinates({ latlng: map.getCenter() }));
    };
  }, [map]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '50px',
      right: '10px',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#333',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 1000,
      border: '2px solid rgba(0,0,0,0.2)',
      backdropFilter: 'blur(2px)',
      whiteSpace: 'nowrap',
      maxWidth: isMobile ? '140px' : '200px',
      lineHeight: '1.2'
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <span>
          <span style={{ color: '#00853f', fontWeight: 'bold' }}>Lat:</span> {coordinates.lat}°
        </span>
        <span>
          <span style={{ color: '#00853f', fontWeight: 'bold' }}>Lng:</span> {coordinates.lng}°
        </span>
      </div>
    </div>
  );
};

// COMPOSANT ÉCHELLE PERSONNALISÉE (EN BAS À DROITE)
const CustomScaleControl = ({ isMobile }) => {
  return (
    <ScaleControl 
      position="bottomright"
      imperial={false}
      metric={true}
      style={{
        marginBottom: isMobile ? '80px' : '90px', // ← Encore plus d'espace
        marginRight: '10px'
      }}
    />
  );
};
// COMPOSANT INFO STATUT (NOMBRE DE RESSOURCES + COMMUNE)
const StatusInfo = ({ ressourcesCount, selectedCommune, currentBasemap, isMobile }) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#333',
      padding: '6px 10px',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
      border: '2px solid rgba(0,0,0,0.2)',
      backdropFilter: 'blur(2px)',
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

// COMPOSANT MESURE DE DISTANCE
const DistanceMeasureTool = ({ isMobile }) => {
  const map = useMap();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [points, setPoints] = useState([]);
  const [distance, setDistance] = useState(0);
  const polylineRef = useRef(null);
  const markersRef = useRef([]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startMeasuring = () => {
    if (isMeasuring) {
      resetMeasuring();
    } else {
      setIsMeasuring(true);
      setPoints([]);
      setDistance(0);
    }
  };

  const resetMeasuring = () => {
    markersRef.current.forEach(marker => {
      if (marker && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    
    if (polylineRef.current && map.hasLayer(polylineRef.current)) {
      map.removeLayer(polylineRef.current);
    }
    
    setPoints([]);
    setDistance(0);
    setIsMeasuring(false);
    markersRef.current = [];
    polylineRef.current = null;
  };

  useEffect(() => {
    if (!isMeasuring) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      const newPoints = [...points, [lat, lng]];
      setPoints(newPoints);

      const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`Point ${newPoints.length}<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
      
      markersRef.current.push(marker);

      if (polylineRef.current && map.hasLayer(polylineRef.current)) {
        map.removeLayer(polylineRef.current);
      }

      if (newPoints.length > 1) {
        const polyline = L.polyline(newPoints, {
          color: '#ff4444',
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 10'
        }).addTo(map);
        
        polylineRef.current = polyline;

        let totalDistance = 0;
        for (let i = 1; i < newPoints.length; i++) {
          totalDistance += calculateDistance(
            newPoints[i-1][0], newPoints[i-1][1],
            newPoints[i][0], newPoints[i][1]
          );
        }
        setDistance(totalDistance);

        marker.setPopupContent(`
          Point ${newPoints.length}<br>
          Lat: ${lat.toFixed(6)}<br>
          Lng: ${lng.toFixed(6)}<br>
          Distance: ${totalDistance.toFixed(2)} km
        `);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMeasuring, points, map]);

  return (
    <button
      onClick={startMeasuring}
      title={isMeasuring ? "Arrêter la mesure (clic pour ajouter des points)" : "Mesurer une distance"}
      style={{
        width: isMobile ? '45px' : '40px',
        height: isMobile ? '45px' : '40px',
        borderRadius: '50%',
        border: `2px solid ${isMeasuring ? '#ff4444' : '#00853f'}`,
        background: isMeasuring ? '#ff4444' : 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '18px' : '16px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        animation: isMeasuring ? 'pulse 2s infinite' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isMeasuring) {
          e.target.style.background = '#00853f';
          e.target.style.transform = 'scale(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMeasuring) {
          e.target.style.background = isMeasuring ? '#ff4444' : 'white';
          e.target.style.transform = 'scale(1)';
        }
      }}
    >
      {isMeasuring ? '⏹️' : '📏'}
    </button>
  );
};

// COMPOSANT DESSIN DE ZONE
const DrawTool = ({ isMobile }) => {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygon, setPolygon] = useState(null);
  const [area, setArea] = useState(0);
  const pointsRef = useRef([]);

  const calculateArea = (points) => {
    if (points.length < 3) return 0;
    
    let total = 0;
    const R = 6371;
    
    for (let i = 0; i < points.length; i++) {
      const point1 = points[i];
      const point2 = points[(i + 1) % points.length];
      
      const x1 = point1[1] * Math.PI / 180;
      const y1 = point1[0] * Math.PI / 180;
      const x2 = point2[1] * Math.PI / 180;
      const y2 = point2[0] * Math.PI / 180;
      
      total += (x2 - x1) * (2 + Math.sin(y1) + Math.sin(y2));
    }
    
    return Math.abs(total * R * R / 2);
  };

  const startDrawing = () => {
    if (isDrawing) {
      if (pointsRef.current.length >= 3) {
        const polygonLayer = L.polygon(pointsRef.current, {
          color: '#00853f',
          weight: 2,
          opacity: 0.8,
          fillColor: '#00853f',
          fillOpacity: 0.3
        }).addTo(map);
        
        setPolygon(polygonLayer);
        
        const calculatedArea = calculateArea(pointsRef.current);
        setArea(calculatedArea);
        
        polygonLayer.bindPopup(`
          <div style="text-align: center;">
            <strong>🗺️ Zone Dessinée</strong><br>
            Surface: ${calculatedArea.toFixed(2)} km²<br>
            <button onclick="window.removeDrawnPolygon()" style="
              margin-top: 5px;
              padding: 4px 8px;
              background: #ff4444;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 10px;
            ">Supprimer</button>
          </div>
        `).openPopup();
      }
      
      setIsDrawing(false);
      pointsRef.current = [];
    } else {
      if (polygon && map.hasLayer(polygon)) {
        map.removeLayer(polygon);
        setPolygon(null);
        setArea(0);
      }
      
      setIsDrawing(true);
      pointsRef.current = [];
    }
  };

  useEffect(() => {
    if (!isDrawing) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      pointsRef.current.push([lat, lng]);

      if (pointsRef.current.length > 1) {
        const existingPolyline = map._drawnPolyline;
        if (existingPolyline) {
          map.removeLayer(existingPolyline);
        }

        const polyline = L.polyline(pointsRef.current, {
          color: '#00853f',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 5'
        }).addTo(map);
        
        map._drawnPolyline = polyline;
      }

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: '📍',
          iconSize: [20, 20],
          className: 'drawing-marker'
        })
      }).addTo(map)
      .bindPopup(`Point ${pointsRef.current.length}`)
      .openPopup();

      if (!map._drawingMarkers) map._drawingMarkers = [];
      map._drawingMarkers.push(marker);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawing, map]);

  useEffect(() => {
    window.removeDrawnPolygon = () => {
      if (polygon && map.hasLayer(polygon)) {
        map.removeLayer(polygon);
        setPolygon(null);
        setArea(0);
      }
    };

    return () => {
      delete window.removeDrawnPolygon;
    };
  }, [polygon, map]);

  return (
    <button
      onClick={startDrawing}
      title={isDrawing ? "Cliquer pour terminer le dessin" : "Dessiner une zone"}
      style={{
        width: isMobile ? '45px' : '40px',
        height: isMobile ? '45px' : '40px',
        borderRadius: '50%',
        border: `2px solid ${isDrawing ? '#00853f' : '#00853f'}`,
        background: isDrawing ? '#00853f' : 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '18px' : '16px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        animation: isDrawing ? 'pulse 1.5s infinite' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isDrawing) {
          e.target.style.background = '#00853f';
          e.target.style.transform = 'scale(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDrawing) {
          e.target.style.background = isDrawing ? '#00853f' : 'white';
          e.target.style.transform = 'scale(1)';
        }
      }}
    >
      {isDrawing ? '✅' : '🖊️'}
    </button>
  );
};

// COMPOSANT BARRE D'OUTILS
const ToolsBarCarte = ({ isMobile }) => {
  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? '80px' : '80px',
      right: '10px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      animation: 'slideInRight 0.5s ease'
    }}>
      <DistanceMeasureTool isMobile={isMobile} />
      <DrawTool isMobile={isMobile} />
      
      <button
        onClick={() => window.print()}
        title="Imprimer la carte"
        style={{
          width: isMobile ? '45px' : '40px',
          height: isMobile ? '45px' : '40px',
          borderRadius: '50%',
          border: '2px solid #00853f',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '18px' : '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#00853f';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'white';
          e.target.style.transform = 'scale(1)';
        }}
      >
        🖨️
      </button>
    </div>
  );
};

// COMPOSANT BARRE DE RECHERCHE DES COMMUNES
const SearchBarCommunes = ({ onCommuneSelect, isMobile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const filteredCommunes = communesSenegal.filter(commune =>
      commune.nom.toLowerCase().includes(term.toLowerCase()) ||
      commune.region.toLowerCase().includes(term.toLowerCase())
    );

    setResults(filteredCommunes.slice(0, 8));
    setShowResults(true);
  };

  const handleSelectCommune = (commune) => {
    if (onCommuneSelect) {
      onCommuneSelect(commune);
    }
    setShowResults(false);
    setSearchTerm('');
    setIsFocused(false);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: isMobile ? '90%' : '400px',
      transition: 'all 0.3s ease'
    }}>
      <div className="search-container">
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
        
        {showResults && results.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            marginTop: '8px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            animation: 'slideDown 0.3s ease'
          }}>
            {results.map((commune, index) => (
              <div
                key={commune.id}
                onClick={() => handleSelectCommune(commune)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  animation: `fadeIn 0.3s ease ${index * 0.1}s both`
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
                  fontWeight: 'bold',
                  transition: 'transform 0.2s ease'
                }}>
                  🏛️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                    {commune.nom}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Région: {commune.region}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#00853f',
                  background: '#e8f5e8',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}>
                  Aller
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && searchTerm && results.length === 0 && (
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            marginTop: '8px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
            border: '1px solid #e0e0e0',
            animation: 'slideDown 0.3s ease'
          }}>
            Aucune commune trouvée pour "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

// COMPOSANTS DE BASE DE LA CARTE
const MapController = ({ isMobile }) => {
  const map = useMap();

  useEffect(() => {
    console.log('🗺️ MapController - Carte initialisée, mobile:', isMobile);
  }, [map, isMobile]);

  return null;
};

const LocateControl = ({ isMobile }) => {
  const map = useMap();

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 15);
          
          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup('📍 Votre position actuelle')
            .openPopup();
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          alert('Impossible de obtenir votre position');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
    }
  };

  useEffect(() => {
    const position = isMobile ? 'topleft' : 'topleft';
    
    const LocateControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        
        const buttonStyle = isMobile ? 
          `width: 45px; height: 45px; font-size: 18px; border-radius: 50%;` :
          `width: 30px; height: 30px; font-size: 14px; border-radius: 4px;`;
        
        container.innerHTML = `
          <a href="#" title="Localiser ma position" style="
            display: flex;
            align-items: center;
            justify-content: center;
            ${buttonStyle}
            background: white;
            border: 2px solid rgba(0,0,0,0.2);
            text-decoration: none;
            color: #333;
            boxShadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
          ">📍</a>
        `;
        
        container.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          locateUser();
        };
        
        return container;
      }
    });

    const locateControl = new LocateControl({ position });
    locateControl.addTo(map);

    return () => {
      map.removeControl(locateControl);
    };
  }, [map, isMobile]);

  return null;
};

const BASEMAPS = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>'
  },
  topo: {
    name: 'Topographique',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
  },
  dark: {
    name: 'Sombre',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

const BasemapController = ({ onBasemapChange }) => {
  const [basemap, setBasemap] = useState('osm');

  const handleBasemapChange = (newBasemap) => {
    setBasemap(newBasemap);
    if (onBasemapChange) {
      onBasemapChange(newBasemap);
    }
  };

  return (
    <div className="basemap-selector">
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
    </div>
  );
};

const DynamicTileLayer = ({ basemap }) => {
  const map = useMap();
  
  useEffect(() => {
    map.invalidateSize();
  }, [basemap, map]);

  const currentBasemap = BASEMAPS[basemap] || BASEMAPS.osm;

  return (
    <TileLayer
      attribution={currentBasemap.attribution}
      url={currentBasemap.url}
    />
  );
};

// Création des icônes personnalisées
const creerIcone = (couleur) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${couleur}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icones = {
  'Agricole': creerIcone('green'),
  'Hydrique': creerIcone('blue'),
  'Commerciale': creerIcone('violet'),
  'Artisanale': creerIcone('orange'),
  'Touristique': creerIcone('red'),
  'Minérale': creerIcone('black'),
  'default': creerIcone('grey')
};

// Popup optimisé mobile
const MobilePopup = ({ ressource }) => (
  <div className="mobile-popup">
    <h6 className="mb-2">{ressource.nom}</h6>
    <div className="mb-1">
      <strong>Type:</strong> {ressource.type}
    </div>
    <div className="mb-1">
      <strong>Potentiel:</strong> 
      <span className={`badge ${ressource.potentiel === 'élevé' ? 'bg-success' : ressource.potentiel === 'moyen' ? 'bg-warning' : 'bg-secondary'} ms-1`}>
        {ressource.potentiel}
      </span>
    </div>
    <div className="mb-1">
      <strong>État:</strong> {ressource.etat_utilisation}
    </div>
    {ressource.description && (
      <div className="mt-2 text-muted small">
        {ressource.description.substring(0, 100)}...
      </div>
    )}
  </div>
);

// Popup desktop
const DesktopPopup = ({ ressource }) => (
  <div>
    <h6>{ressource.nom}</h6>
    <p><strong>Type:</strong> {ressource.type}</p>
    <p><strong>Potentiel:</strong> {ressource.potentiel}</p>
    <p><strong>État:</strong> {ressource.etat_utilisation}</p>
    {ressource.description && (
      <p className="text-muted">{ressource.description}</p>
    )}
    <small className="text-muted">
      ID: {ressource.id}
    </small>
  </div>
);

// FONCTION POUR OBTENIR LES COORDONNÉES
const obtenirCoordonnees = (ressource) => {
  if (ressource.localisation && ressource.localisation.coordinates) {
    const [lng, lat] = ressource.localisation.coordinates;
    return [lat, lng];
  }
  
  if (ressource.latitude && ressource.longitude) {
    const lat = parseFloat(ressource.latitude);
    const lng = parseFloat(ressource.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }
  
  return [14.7167, -17.4677];
};

const getIconForRessource = (typeRessource) => {
  return icones[typeRessource] || icones.default;
};

// COMPOSANT PRINCIPAL
const CarteCommunale = ({ ressources, communes, onCommuneSelect, isMobile }) => {
  const positionDefaut = [14.7167, -17.4677];
  const mapRef = useRef();
  const [cartePrete, setCartePrete] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('osm');
  const [selectedCommune, setSelectedCommune] = useState(null);

  const handleCommuneSelect = (commune) => {
    setSelectedCommune(commune);
    
    if (mapRef.current) {
      const newPosition = [parseFloat(commune.latitude), parseFloat(commune.longitude)];
      mapRef.current.setView(newPosition, 13);
      
      if (window.communeMarker) {
        mapRef.current.removeLayer(window.communeMarker);
      }
      
      window.communeMarker = L.marker(newPosition)
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="padding: 8px; text-align: center;">
            <strong>🏛️ ${commune.nom}</strong>
            <br/>
            <small>Région: ${commune.region}</small>
            <br/>
            <button onclick="window.closeCommunePopup()" style="
              margin-top: 8px;
              padding: 4px 12px;
              background: #00853f;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Fermer</button>
          </div>
        `)
        .openPopup();
    }

    if (onCommuneSelect) {
      onCommuneSelect(commune);
    }
  };

  useEffect(() => {
    window.closeCommunePopup = () => {
      if (window.communeMarker) {
        window.communeMarker.closePopup();
      }
    };

    return () => {
      delete window.closeCommunePopup;
    };
  }, []);

  const ressourcesAvecCoordonnees = ressources ? ressources.filter(ressource => {
    const coords = obtenirCoordonnees(ressource);
    return coords && coords[0] !== positionDefaut[0] && coords[1] !== positionDefaut[1];
  }) : [];

  const currentBasemapData = BASEMAPS[currentBasemap] || BASEMAPS.osm;

  return (
    <div className={`carte-container ${isMobile ? 'mobile' : 'desktop'}`} style={{
      animation: 'fadeIn 0.8s ease'
    }}>
      
      {/* BARRE DE RECHERCHE DES COMMUNES (en dehors de MapContainer) */}
      <SearchBarCommunes 
        onCommuneSelect={handleCommuneSelect}
        isMobile={isMobile}
      />
      
      <MapContainer 
        center={positionDefaut} 
        zoom={isMobile ? 10 : 12} 
        style={{ 
          height: '100%', 
          width: '100%',
        }}
        zoomControl={!isMobile}
        ref={mapRef}
        whenReady={() => {
          console.log('✅ Carte Leaflet prête !');
          setCartePrete(true);
        }}
      >
        {/* BARRE D'OUTILS (dans MapContainer) */}
        <ToolsBarCarte isMobile={isMobile} />
        
        <MapController isMobile={isMobile} />
        <BasemapController onBasemapChange={setCurrentBasemap} />
        <LocateControl isMobile={isMobile} />
        
        {/* ÉCHELLE (en bas à droite) */}
        <CustomScaleControl isMobile={isMobile} />
        
        {/* COORDONNÉES (en bas à droite, au-dessus de l'échelle) */}
        <CoordinatesDisplay isMobile={isMobile} />
        
        {/* INFO STATUT (en bas à gauche) */}
        <StatusInfo 
          ressourcesCount={ressourcesAvecCoordonnees.length}
          selectedCommune={selectedCommune}
          currentBasemap={currentBasemapData}
          isMobile={isMobile}
        />
        
        {/* TileLayer dynamique */}
        <DynamicTileLayer basemap={currentBasemap} />
        
        {/* Marqueurs des ressources */}
        {cartePrete && ressourcesAvecCoordonnees.map((ressource) => {
          const coords = obtenirCoordonnees(ressource);
          
          return (
            <Marker
              key={ressource.id}
              position={coords}
              icon={getIconForRessource(ressource.type)}
            >
              <Popup>
                {isMobile ? (
                  <MobilePopup ressource={ressource} />
                ) : (
                  <DesktopPopup ressource={ressource} />
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Styles CSS globaux */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideInRight {
            from { transform: translateX(50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default CarteCommunale;