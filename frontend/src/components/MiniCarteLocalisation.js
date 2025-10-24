import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

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
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClicCarte 
          onPositionChange={onPositionChange}
          position={position}
        />
      </MapContainer>
    </div>
  );
};

export default MiniCarteLocalisation;