import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Composant pour recentrer la carte quand la position change
function MapUpdater({ latitude, longitude }) {
  const map = useMap();
  
  useEffect(() => {
    if (latitude && longitude) {
      const newPosition = [parseFloat(latitude), parseFloat(longitude)];
      map.setView(newPosition, map.getZoom());
    }
  }, [latitude, longitude, map]);
  
  return null;
}

// Composant pour capturer les clics sur la carte
function ClicCarte({ onPositionChange, position }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onPositionChange(lat, lng);
    },
  });

  return position ? (
    <Marker position={position} />
  ) : null;
}

const MiniCarteLocalisation = ({ latitude, longitude, onPositionChange }) => {
  const position = [parseFloat(latitude), parseFloat(longitude)];

  return (
    <div style={{ height: '200px', borderRadius: '5px', overflow: 'hidden' }}>
      <MapContainer 
        center={position} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater latitude={latitude} longitude={longitude} />
        <ClicCarte 
          onPositionChange={onPositionChange}
          position={position}
        />
      </MapContainer>
    </div>
  );
};

export default MiniCarteLocalisation;