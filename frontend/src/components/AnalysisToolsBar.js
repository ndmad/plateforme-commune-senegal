import React from 'react';
import { SquaresIntersect, Fingerprint } from 'lucide-react';

const AnalysisToolsBar = ({ isMobile, ressources, mapRef }) => {
  
  const obtenirCoordonnees = (ressource) => {
    if (ressource.localisation && ressource.localisation.coordinates) {
      const [lng, lat] = ressource.localisation.coordinates;
      return [lat, lng];
    }
    if (ressource.latitude && ressource.longitude) {
      const lat = parseFloat(ressource.latitude);
      const lng = parseFloat(ressource.longitude);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return [14.7167, -17.4677];
  };

  const handleZoneIntersection = async () => {
    if (!window.drawnItems || window.drawnItems.getLayers().length === 0) {
      alert('Veuillez d\'abord dessiner une zone sur la carte');
      return;
    }

    try {
      const drawnLayer = window.drawnItems.getLayers()[0];
      
      const intersectingResources = ressources.filter(ressource => {
        const ressourceCoords = obtenirCoordonnees(ressource);
        
        if (ressourceCoords[0] === 14.7167 && ressourceCoords[1] === -17.4677) {
          return false;
        }
        
        const bounds = drawnLayer.getBounds();
        return bounds.contains(ressourceCoords);
      });

      console.log(`✅ ${intersectingResources.length} ressources dans la zone`);
      
      if (intersectingResources.length > 0) {
        const popupContent = `
          <div style="padding: 10px; max-height: 300px; overflow-y: auto;">
            <h4 style="color: #00853f; margin-bottom: 10px;">Résultats d'intersection</h4>
            <p><strong>${intersectingResources.length} ressources trouvées dans la zone</strong></p>
            <div style="max-height: 200px; overflow-y: auto;">
              ${intersectingResources.map(ressource => 
                `<div style="padding: 8px; border-bottom: 1px solid #eee; background: #f8f9fa; margin-bottom: 5px; border-radius: 4px;">
                  <strong>${ressource.nom}</strong><br>
                  <small>Type: ${ressource.type} | Potentiel: ${ressource.potentiel}</small>
                </div>`
              ).join('')}
            </div>
          </div>
        `;
        
        const center = drawnLayer.getBounds().getCenter();
        window.L.popup()
          .setLatLng(center)
          .setContent(popupContent)
          .openOn(mapRef.current);
      } else {
        alert('Aucune ressource ne se trouve dans la zone sélectionnée');
      }

    } catch (error) {
      console.error('❌ Erreur calcul intersection:', error);
      alert('Erreur lors du calcul de l\'intersection');
    }
  };

  const handleDensityMap = () => {
    if (!ressources || ressources.length === 0) {
      alert('Aucune ressource disponible pour la carte de densité');
      return;
    }

    try {
      if (window.densityLayer && mapRef.current?.hasLayer(window.densityLayer)) {
        mapRef.current.removeLayer(window.densityLayer);
      }

      const validResources = ressources.filter(ressource => {
        const coords = obtenirCoordonnees(ressource);
        return coords && coords[0] !== 14.7167 && coords[1] !== -17.4677;
      });

      if (validResources.length === 0) {
        alert('Aucune ressource avec des coordonnées valides');
        return;
      }

      window.densityLayer = window.L.layerGroup().addTo(mapRef.current);

      validResources.forEach(ressource => {
        const coords = obtenirCoordonnees(ressource);
        const marker = window.L.circleMarker(coords, {
          radius: 8,
          fillColor: '#ff7800',
          color: '#ff0000',
          weight: 1,
          opacity: 0.7,
          fillOpacity: 0.3
        }).addTo(window.densityLayer);
      });

      console.log(`✅ Carte de densité créée avec ${validResources.length} points`);

    } catch (error) {
      console.error('❌ Erreur création carte densité:', error);
      alert('Erreur lors de la création de la carte de densité');
    }
  };

  const buttonStyle = {
    width: isMobile ? '50px' : '45px',
    height: isMobile ? '50px' : '45px',
    border: '3px solid white',
    color: 'white',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '18px' : '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
     
      <button
        onClick={handleZoneIntersection}
        title="Analyser l'intersection avec une zone dessinée"
        style={{ ...buttonStyle, background: '#00853f' }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.background = '#006b33';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.background = '#00853f';
        }}
      >
        <SquaresIntersect size={isMobile ? 20 : 18} />
      </button>

      <button
        onClick={handleDensityMap}
        title="Afficher la carte de densité des ressources"
        style={{ ...buttonStyle, background: '#17a2b8' }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.background = '#138496';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.background = '#17a2b8';
        }}
      >
        <Fingerprint size={isMobile ? 20 : 18} />
      </button>
    </div>
  );
};

export default AnalysisToolsBar;