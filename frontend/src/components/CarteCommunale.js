import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Création CORRECTE des icônes personnalisées
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

// Icônes personnalisées - version CORRIGÉE
const icones = {
  'Agricole': creerIcone('green'),
  'Hydrique': creerIcone('blue'),
  'Commerciale': creerIcone('violet'),
  'Artisanale': creerIcone('orange'),
  'Touristique': creerIcone('red'),
  'Minérale': creerIcone('black')
};

const CarteCommunale = ({ ressources, communes, onCommuneSelect }) => {
  const positionDefaut = [14.7167, -17.4677]; // Dakar

  console.log('Ressources dans CarteCommunale:', ressources); // DEBUG

  return (
    <MapContainer 
      center={positionDefaut} 
      zoom={10} 
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* AFFICHER les ressources avec localisation GeoJSON */}
      {ressources && ressources.map((ressource) => {
        if (!ressource.localisation || !ressource.localisation.coordinates) {
          console.log('Ressource sans coordonnées valides:', ressource.nom);
          return null;
        }
        
        // PostGIS GeoJSON stocke [longitude, latitude]
        const coords = [
          ressource.localisation.coordinates[1], // latitude
          ressource.localisation.coordinates[0]  // longitude
        ];
        
        console.log(`Ressource "${ressource.nom}" à:`, coords);

        // Utiliser l'icône personnalisée ou l'icône par défaut
        const icone = ressource.type && icones[ressource.type] ? icones[ressource.type] : L.Icon.Default;

        return (
          <Marker 
            key={ressource.id} 
            position={coords}
            icon={icone}
          >
            <Popup>
              <div>
                <h6>{ressource.nom}</h6>
                <p><strong>Type:</strong> {ressource.type}</p>
                <p><strong>Potentiel:</strong> {ressource.potentiel}</p>
                <p>{ressource.description}</p>
                <small>ID: {ressource.id}</small>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default CarteCommunale;