import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Correction CRITIQUE des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

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

// Composant de localisation automatique - CORRIGÉ POUR DESKTOP/MOBILE
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
    // Position différente selon mobile/desktop
    const position = isMobile ? 'topleft' : 'topleft';
    
    const LocateControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        
        // Style différent selon mobile/desktop
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
          zIndex: 1000, // CORRIGÉ
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
    // Recentrer la carte quand le basemap change
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

const CarteCommunale = ({ ressources, communes, onCommuneSelect, isMobile }) => {
  const positionDefaut = [14.7167, -17.4677]; // Dakar
  const mapRef = useRef();
  const [cartePrete, setCartePrete] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('osm');

  // Fonction pour obtenir les coordonnées d'une ressource
  const obtenirCoordonnees = (ressource) => {
    // ESSAYER DIFFÉRENTES SOURCES DE COORDONNÉES
    
    // 1. Si GeoJSON PostGIS (format [lng, lat])
    if (ressource.localisation && ressource.localisation.coordinates) {
      const [lng, lat] = ressource.localisation.coordinates;
      console.log(`📍 ${ressource.nom}: GeoJSON [${lng}, ${lat}]`);
      return [lat, lng];
    }
    
    // 2. Si champs latitude/longitude séparés
    if (ressource.latitude && ressource.longitude) {
      const lat = parseFloat(ressource.latitude);
      const lng = parseFloat(ressource.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log(`📍 ${ressource.nom}: Champs séparés [${lat}, ${lng}]`);
        return [lat, lng];
      }
    }
    
    // 3. Coordonnées par défaut si rien ne fonctionne
    console.warn(`❌ ${ressource.nom}: Aucune coordonnée valide, utilisation défaut`);
    return positionDefaut;
  };

  const getIconForRessource = (typeRessource) => {
    return icones[typeRessource] || icones.default;
  };

  // Filtrer les ressources avec coordonnées valides
  const ressourcesAvecCoordonnees = ressources ? ressources.filter(ressource => {
    const coords = obtenirCoordonnees(ressource);
    const estValide = coords && coords[0] !== positionDefaut[0] && coords[1] !== positionDefaut[1];
    if (!estValide) {
      console.warn(`🚫 ${ressource.nom} ignorée - coordonnées invalides`);
    }
    return estValide;
  }) : [];

  console.log(`🗺️ ${ressourcesAvecCoordonnees.length}/${ressources ? ressources.length : 0} ressources affichées`);

  const handleBasemapChange = (newBasemap) => {
    console.log(`🔄 Changement de basemap: ${newBasemap}`);
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
      </div>
    </div>
  );
};

export default CarteCommunale;