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

const CarteCommunale = ({ ressources, communes, onCommuneSelect, isMobile }) => {
  const positionDefaut = [14.7167, -17.4677]; // Dakar
  const mapRef = useRef();
  const [cartePrete, setCartePrete] = useState(false);

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
        
        {/* TileLayer avec fallback */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            loading: () => console.log('🔄 Chargement des tuiles...'),
            load: () => console.log('✅ Tuiles chargées !'),
            error: () => console.error('❌ Erreur chargement tuiles')
          }}
        />
        
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
        🗺️ {ressourcesAvecCoordonnees.length} ressources
      </div>
    </div>
  );
};

export default CarteCommunale;