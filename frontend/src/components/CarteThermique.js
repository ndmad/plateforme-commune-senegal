import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip, LayersControl } from 'react-leaflet';
import { scaleLinear, scaleSequential } from 'd3-scale';
import { interpolateYlOrRd, interpolateGreens, interpolateBlues } from 'd3-scale-chromatic';
import 'leaflet/dist/leaflet.css';

// Couches géographiques simulées pour le Sénégal (à remplacer par des vraies données GeoJSON)
const regionsSenegal = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Dakar", "code": "DK" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-17.5, 14.6], [-17.3, 14.6], [-17.3, 14.8], [-17.5, 14.8], [-17.5, 14.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Thiès", "code": "TH" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-17.2, 14.7], [-16.8, 14.7], [-16.8, 15.0], [-17.2, 15.0], [-17.2, 14.7]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Diourbel", "code": "DB" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-16.5, 14.5], [-16.0, 14.5], [-16.0, 14.9], [-16.5, 14.9], [-16.5, 14.5]]]
      }
    }
  ]
};

const CarteThermique = ({ ressources, communes }) => {
  const [typeVisualisation, setTypeVisualisation] = useState('densite');
  const [donneesAggregees, setDonneesAggregees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Agrégation avancée des données
  useEffect(() => {
    if (ressources.length && communes.length) {
      const aggregees = communes.map(commune => {
        const ressourcesCommune = ressources.filter(r => r.commune_id === commune.id);
        const total = ressourcesCommune.length;
        const hautPotentiel = ressourcesCommune.filter(r => r.potentiel === 'élevé').length;
        const optimisees = ressourcesCommune.filter(r => r.etat_utilisation === 'optimisé').length;
        
        // Score composite pour la visualisation
        const score = total + (hautPotentiel * 2) + (optimisees * 1.5);
        
        return {
          ...commune,
          total,
          hautPotentiel,
          optimisees,
          score,
          ressources: ressourcesCommune
        };
      });
      
      setDonneesAggregees(aggregees);
      setLoading(false);
    }
  }, [ressources, communes]);

  // Échelles de couleurs selon le type de visualisation
  const getColorScale = useMemo(() => {
    const scores = donneesAggregees.map(d => d.score);
    const maxScore = Math.max(...scores, 1);
    
    switch (typeVisualisation) {
      case 'densite':
        return scaleSequential(interpolateYlOrRd)
          .domain([0, maxScore]);
      
      case 'potentiel':
        return scaleSequential(interpolateGreens)
          .domain([0, Math.max(...donneesAggregees.map(d => d.hautPotentiel), 1)]);
      
      case 'optimisation':
        return scaleSequential(interpolateBlues)
          .domain([0, Math.max(...donneesAggregees.map(d => d.optimisees), 1)]);
      
      default:
        return scaleSequential(interpolateYlOrRd).domain([0, maxScore]);
    }
  }, [donneesAggregees, typeVisualisation]);

  // Style pour les polygones GeoJSON
  const getRegionStyle = (feature) => {
    const communeData = donneesAggregees.find(c => 
      c.nom.toLowerCase().includes(feature.properties.name.toLowerCase())
    );
    
    if (!communeData) {
      return {
        fillColor: '#ccc',
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.3
      };
    }

    let value;
    switch (typeVisualisation) {
      case 'densite':
        value = communeData.score;
        break;
      case 'potentiel':
        value = communeData.hautPotentiel;
        break;
      case 'optimisation':
        value = communeData.optimisees;
        break;
      default:
        value = communeData.score;
    }

    return {
      fillColor: getColorScale(value),
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };

  // Gestionnaire d'événements pour chaque région
  const onEachRegion = (feature, layer) => {
    const communeData = donneesAggregees.find(c => 
      c.nom.toLowerCase().includes(feature.properties.name.toLowerCase())
    );

    const popupContent = communeData ? `
      <div style="min-width: 200px; padding: 8px;">
        <h4 style="margin: 0 0 8px 0; color: var(--primary-600);">${communeData.nom}</h4>
        <div style="display: grid; gap: 4px; font-size: 14px;">
          <div>📊 <strong>${communeData.total}</strong> ressources totales</div>
          <div>⭐ <strong>${communeData.hautPotentiel}</strong> haut potentiel</div>
          <div>✅ <strong>${communeData.optimisees}</strong> ressources optimisées</div>
          <div>🏆 <strong>${communeData.score.toFixed(1)}</strong> score global</div>
        </div>
      </div>
    ` : `
      <div style="min-width: 150px; padding: 8px;">
        <h4 style="margin: 0 0 8px 0;">${feature.properties.name}</h4>
        <p style="margin: 0; color: #666;">Aucune donnée disponible</p>
      </div>
    `;

    layer.bindPopup(popupContent);
    
    layer.on('mouseover', function (e) {
      this.setStyle({
        weight: 3,
        color: '#666',
        fillOpacity: 0.9
      });
    });
    
    layer.on('mouseout', function (e) {
      this.setStyle(getRegionStyle(feature));
    });
  };

  if (loading) {
    return (
      <div className="flutter-card elevated" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>🌡️ Carte Thématique</h3>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '200px'
        }}>
          <div className="flutter-spinner" style={{ marginBottom: '16px' }}></div>
          <p style={{ color: 'var(--on-background)' }}>Chargement des données cartographiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flutter-card elevated" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* En-tête avec contrôles */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>🌡️ Carte Thématique des Ressources</h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="flutter-input"
            value={typeVisualisation}
            onChange={(e) => setTypeVisualisation(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="densite">📊 Densité des ressources</option>
            <option value="potentiel">⭐ Potentiel élevé</option>
            <option value="optimisation">✅ Taux d'optimisation</option>
          </select>
        </div>
      </div>

      {/* Carte */}
      <div style={{ 
        height: '500px', 
        borderRadius: 'var(--radius-md)', 
        overflow: 'hidden',
        border: '1px solid #f1f5f9'
      }}>
        <MapContainer
          center={[14.4974, -14.4524]} // Centre du Sénégal
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri'
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Couche des régions */}
          <GeoJSON
            key={typeVisualisation} // Force le re-render quand la visualisation change
            data={regionsSenegal}
            style={getRegionStyle}
            onEachFeature={onEachRegion}
          />
        </MapContainer>
      </div>

      {/* Légende interactive */}
      <div style={{ 
        marginTop: '20px',
        padding: '16px',
        background: 'var(--background)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #f1f5f9'
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🎨 Légende - {
            typeVisualisation === 'densite' ? 'Densité des ressources' :
            typeVisualisation === 'potentiel' ? 'Ressources à haut potentiel' :
            'Ressources optimisées'
          }
        </h4>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Faible</span>
          
          {/* Barre de gradient */}
          <div style={{
            flex: 1,
            height: '20px',
            background: `linear-gradient(90deg, ${getColorScale(0)}, ${getColorScale(0.25)}, ${getColorScale(0.5)}, ${getColorScale(0.75)}, ${getColorScale(1)})`,
            borderRadius: 'var(--radius-sm)',
            maxWidth: '300px'
          }}></div>
          
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Élevé</span>
        </div>

        {/* Statistiques résumées */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginTop: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-600)' }}>
              {donneesAggregees.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--on-background)' }}>Communes</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
              {donneesAggregees.reduce((sum, d) => sum + d.hautPotentiel, 0)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--on-background)' }}>Haut potentiel</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
              {donneesAggregees.reduce((sum, d) => sum + d.optimisees, 0)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--on-background)' }}>Optimisées</div>
          </div>
        </div>
      </div>

      {/* Note informative */}
      <div style={{ 
        marginTop: '12px',
        padding: '12px',
        background: 'var(--primary-50)',
        borderRadius: 'var(--radius-md)',
        fontSize: '12px',
        color: 'var(--primary-700)'
      }}>
        💡 <strong>Conseil :</strong> Cliquez sur une région pour voir les détails. Utilisez les différentes visualisations pour analyser les forces et faiblesses de chaque territoire.
      </div>
    </div>
  );
};

export default CarteThermique;