import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CarteThermique = ({ ressources, communes }) => {
  const [typeVisualisation, setTypeVisualisation] = useState('densite');

  // Agrégation des données pour la carte thermique
  const donneesCarte = useMemo(() => {
    if (!ressources.length || !communes.length) return [];

    return communes.map(commune => {
      const ressourcesCommune = ressources.filter(r => r.commune_id === commune.id);
      const count = ressourcesCommune.length;
      
      // Calcul de l'intensité (0-1) basée sur le nombre de ressources
      const maxRessources = Math.max(...communes.map(c => 
        ressources.filter(r => r.commune_id === c.id).length
      ));
      const intensite = maxRessources > 0 ? count / maxRessources : 0;

      return {
        commune,
        count,
        intensite,
        ressources: ressourcesCommune
      };
    });
  }, [ressources, communes]);

  const getColor = (intensite) => {
    // Échelle de couleur : vert (faible) -> rouge (fort)
    const r = Math.floor(255 * intensite);
    const g = Math.floor(255 * (1 - intensite));
    return `rgb(${r}, ${g}, 0)`;
  };

  const getRadius = (count) => {
    // Rayon proportionnel au nombre de ressources
    return Math.max(8, Math.sqrt(count) * 3);
  };

  if (!donneesCarte.length) {
    return (
      <div className="flutter-card elevated" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>🌡️ Carte Thermique</h3>
        <p style={{ color: 'var(--on-background)', textAlign: 'center', padding: '40px' }}>
          Aucune donnée disponible pour afficher la carte thermique
        </p>
      </div>
    );
  }

  return (
    <div className="flutter-card elevated" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>🌡️ Carte Thermique</h3>
        
        <select 
          className="flutter-input"
          value={typeVisualisation}
          onChange={(e) => setTypeVisualisation(e.target.value)}
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="densite">Densité ressources</option>
          <option value="potentiel">Potentiel élevé</option>
        </select>
      </div>

      <div style={{ height: '400px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <MapContainer
          center={[14.4974, -14.4524]} // Centre du Sénégal
          zoom={7}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {donneesCarte.map(({ commune, count, intensite, ressources }) => {
            if (!commune.latitude || !commune.longitude) return null;

            return (
              <CircleMarker
                key={commune.id}
                center={[parseFloat(commune.latitude), parseFloat(commune.longitude)]}
                radius={getRadius(count)}
                fillColor={getColor(intensite)}
                color="#fff"
                weight={1}
                opacity={1}
                fillOpacity={0.7}
              >
                <Tooltip permanent={false}>
                  <div style={{ minWidth: '150px' }}>
                    <strong>{commune.nom}</strong>
                    <br />
                    📊 {count} ressources
                    <br />
                    ⭐ {ressources.filter(r => r.potentiel === 'élevé').length} haut potentiel
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Légende */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: '16px',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            background: 'rgb(0, 255, 0)',
            borderRadius: '50%'
          }}></div>
          <span style={{ fontSize: '12px' }}>Faible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            background: 'rgb(255, 255, 0)',
            borderRadius: '50%'
          }}></div>
          <span style={{ fontSize: '12px' }}>Moyen</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            background: 'rgb(255, 0, 0)',
            borderRadius: '50%'
          }}></div>
          <span style={{ fontSize: '12px' }}>Élevé</span>
        </div>
      </div>
    </div>
  );
};

export default CarteThermique;