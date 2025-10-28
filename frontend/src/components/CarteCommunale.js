import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { communesSenegal } from '../data/communesSenegal';

// Correction CRITIQUE des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// COMPOSANT BARRE DE RECHERCHE DES COMMUNES
const SearchBarCommunes = ({ onCommuneSelect, isMobile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Recherche dans les communes
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
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: isMobile ? '90%' : '400px'
    }}>
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Rechercher une commune..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '25px',
            border: '2px solid #00853f',
            fontSize: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            outline: 'none',
            background: 'white'
          }}
        />
        
        {showResults && results.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            marginTop: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0'
          }}>
            {results.map((commune, index) => (
              <div
                key={commune.id}
                onClick={() => handleSelectCommune(commune)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
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
                  fontWeight: '600'
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
            border: '1px solid #e0e0e0'
          }}>
            Aucune commune trouvée pour "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

// COMPOSANT BARRE D'OUTILS AMÉLIORÉ
const ToolsBarCarte = ({ onMeasure, onDraw, onPrint, isMobile }) => {
  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? '80px' : '80px',
      right: '10px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <button
        onClick={onMeasure}
        title="Mesurer une distance"
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
        📏
      </button>

      <button
        onClick={onDraw}
        title="Dessiner une zone"
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
        🖊️
      </button>

      <button
        onClick={onPrint}
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

// Composant pour debugger les données
const DebugComponent = ({ ressources }) => {
  console.log('🐛 DEBUG CarteCommunale - Données reçues:', ressources);
  
  if (ressources && ressources.length > 0) {
    ressources.forEach((ressource, index) => {
      console.log(`📍 Ressource ${index}:`, {
        id: ressource.id,
        nom: ressource.nom,
        type: ressource.type,
        localisation: ressource.localisation,
        coordinates: ressource.localisation?.coordinates,
        latitude: ressource.latitude,
        longitude: ressource.longitude
      });
    });
  }
  
  return null;
};

// Contrôleur de carte
const MapController = ({ isMobile }) => {
  const map = useMap();

  useEffect(() => {
    console.log('🗺️ MapController - Carte initialisée, mobile:', isMobile);
  }, [map, isMobile]);

  return null;
};

// Composant de localisation automatique
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
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
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

// Définition des basemaps
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

// Composant pour changer le basemap
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

// Composant TileLayer dynamique
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

// COMPOSANT PRINCIPAL AMÉLIORÉ
const CarteCommunale = ({ ressources, communes, onCommuneSelect, isMobile }) => {
  const positionDefaut = [14.7167, -17.4677]; // Dakar
  const mapRef = useRef();
  const [cartePrete, setCartePrete] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('osm');
  const [selectedCommune, setSelectedCommune] = useState(null);

  // ✅ Gestion de la sélection d'une commune depuis la recherche
  const handleCommuneSelect = (commune) => {
    setSelectedCommune(commune);
    
    if (mapRef.current) {
      const newPosition = [parseFloat(commune.latitude), parseFloat(commune.longitude)];
      mapRef.current.setView(newPosition, 13);
      
      // Ajouter un marqueur temporaire pour la commune sélectionnée
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

  // Fonction pour fermer le popup de la commune
  useEffect(() => {
    window.closeCommunePopup = () => {
      if (window.communeMarker) {
        window.communeMarker.closePopup();
      }
    };
  }, []);

  // ✅ Gestion des outils
  const handleMeasureDistance = () => {
    alert('📏 Fonctionnalité de mesure en développement...');
  };

  const handleDrawPolygon = () => {
    alert('🖊️ Fonctionnalité de dessin en développement...');
  };

  const handlePrintMap = () => {
    window.print();
  };

  // ✅ FONCTION EXISTANTE QUI FONCTIONNE BIEN
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
    
    return positionDefaut;
  };

  const getIconForRessource = (typeRessource) => {
    return icones[typeRessource] || icones.default;
  };

  // Filtrer les ressources avec coordonnées valides
  const ressourcesAvecCoordonnees = ressources ? ressources.filter(ressource => {
    const coords = obtenirCoordonnees(ressource);
    return coords && coords[0] !== positionDefaut[0] && coords[1] !== positionDefaut[1];
  }) : [];

  console.log(`🗺️ ${ressourcesAvecCoordonnees.length}/${ressources ? ressources.length : 0} ressources affichées`);

  const handleBasemapChange = (newBasemap) => {
    setCurrentBasemap(newBasemap);
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

  return (
    <div className={`carte-container ${isMobile ? 'mobile' : 'desktop'}`}>
      <DebugComponent ressources={ressources} />
      
      {/* BARRE DE RECHERCHE DES COMMUNES */}
      <SearchBarCommunes 
        onCommuneSelect={handleCommuneSelect}
        isMobile={isMobile}
      />
      
      {/* BARRE D'OUTILS */}
      <ToolsBarCarte 
        onMeasure={handleMeasureDistance}
        onDraw={handleDrawPolygon}
        onPrint={handlePrintMap}
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
        <MapController isMobile={isMobile} />
        <BasemapController onBasemapChange={handleBasemapChange} />
        <LocateControl isMobile={isMobile} />
        
        {/* TileLayer dynamique qui change avec le basemap */}
        <DynamicTileLayer basemap={currentBasemap} />
        
        {/* Marqueurs des ressources */}
        {cartePrete && ressourcesAvecCoordonnees.map((ressource) => {
          const coords = obtenirCoordonnees(ressource);
          
          return (
            <Marker
              key={ressource.id}
              position={coords}
              icon={getIconForRessource(ressource.type)}
              eventHandlers={{
                click: () => {
                  console.log(`📍 Clic sur: ${ressource.nom}`, coords);
                }
              }}
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

      {/* Message d'information */}
      {ressourcesAvecCoordonnees.length === 0 && ressources && ressources.length > 0 && (
        <div className="alert alert-warning position-absolute top-0 start-0 m-2" style={{zIndex: 1000, maxWidth: '300px'}}>
          <small>
            ⚠️ Aucune ressource avec coordonnées valides.
            <br />
            Vérifiez les données dans la console.
          </small>
        </div>
      )}

      {/* Contrôles mobiles */}
      {isMobile && (
        <div className="mobile-map-controls">
          <button 
            className="map-control-btn"
            onClick={() => mapRef.current?.setZoom(mapRef.current?.getZoom() + 1)}
            title="Zoom avant"
          >
            ➕
          </button>
          <button 
            className="map-control-btn"
            onClick={() => mapRef.current?.setZoom(mapRef.current?.getZoom() - 1)}
            title="Zoom arrière"
          >
            ➖
          </button>
          <button 
            className="map-control-btn"
            onClick={() => mapRef.current?.setView(positionDefaut, 10)}
            title="Recentrer"
          >
            🎯
          </button>
        </div>
      )}

      {/* Indicateur de statut */}
      <div className="position-absolute bottom-0 start-0 m-2 bg-dark text-white px-2 py-1 rounded small" style={{zIndex: 1000}}>
        🗺️ {ressourcesAvecCoordonnees.length} ressources | {BASEMAPS[currentBasemap].name}
        {selectedCommune && ` | 📍 ${selectedCommune.nom}`}
      </div>
    </div>
  );
};

export default CarteCommunale;