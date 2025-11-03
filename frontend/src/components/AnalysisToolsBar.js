import React from 'react';

const AnalysisToolsBar = ({ isMobile, ressources, mapRef }) => {
  
  // ============================================================================
  // FONCTION UTILITAIRE POUR OBTENIR LES COORDONNÉES
  // ============================================================================
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
    return [14.7167, -17.4677]; // Position par défaut
  };

  // ============================================================================
  // OUTIL D'INTERSECTION DE ZONE
  // ============================================================================
  const handleZoneIntersection = async () => {
    if (!window.drawnItems || window.drawnItems.getLayers().length === 0) {
      alert('Veuillez d\'abord dessiner une zone sur la carte');
      return;
    }

    try {
      const drawnLayer = window.drawnItems.getLayers()[0];
      
      // Filtrer les ressources qui sont dans la zone dessinée
      const intersectingResources = ressources.filter(ressource => {
        const ressourceCoords = obtenirCoordonnees(ressource);
        
        // Vérifier si les coordonnées sont valides (pas les valeurs par défaut)
        if (ressourceCoords[0] === 14.7167 && ressourceCoords[1] === -17.4677) {
          return false;
        }
        
        // Vérifier si le point est dans les bounds du polygone
        const bounds = drawnLayer.getBounds();
        return bounds.contains(ressourceCoords);
      });

      console.log(`✅ ${intersectingResources.length} ressources dans la zone`);
      
      // Afficher les résultats
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

  // ============================================================================
  // CARTE DE DENSITÉ SIMPLIFIÉE
  // ============================================================================
  const handleDensityMap = () => {
    if (!ressources || ressources.length === 0) {
      alert('Aucune ressource disponible pour la carte de densité');
      return;
    }

    try {
      // Nettoyer les couches précédentes
      if (window.densityLayer && mapRef.current?.hasLayer(window.densityLayer)) {
        mapRef.current.removeLayer(window.densityLayer);
      }

      // Utiliser uniquement les ressources valides avec coordonnées
      const validResources = ressources.filter(ressource => {
        const coords = obtenirCoordonnees(ressource);
        return coords && coords[0] !== 14.7167 && coords[1] !== -17.4677;
      });

      if (validResources.length === 0) {
        alert('Aucune ressource avec des coordonnées valides');
        return;
      }

      // Créer un groupe pour les marqueurs de densité
      window.densityLayer = window.L.layerGroup().addTo(mapRef.current);

      // Ajouter des marqueurs avec opacité réduite pour l'effet de densité
      validResources.forEach(ressource => {
        const coords = obtenirCoordonnees(ressource);
        const marker = window.L.circleMarker(coords, {
          radius: 8, // ← MODIFIER pour changer la taille des cercles
          fillColor: '#ff7800', // ← MODIFIER pour changer la couleur de remplissage
          color: '#ff0000', // ← MODIFIER pour changer la couleur de bordure
          weight: 1, // ← MODIFIER pour changer l'épaisseur de bordure
          opacity: 0.7, // ← MODIFIER pour changer l'opacité de bordure
          fillOpacity: 0.3 // ← MODIFIER pour changer l'opacité de remplissage
        }).addTo(window.densityLayer);
      });

      console.log(`✅ Carte de densité créée avec ${validResources.length} points`);

    } catch (error) {
      console.error('❌ Erreur création carte densité:', error);
      alert('Erreur lors de la création de la carte de densité');
    }
  };

  // ============================================================================
  // STYLES DES BOUTONS - Modifier ici pour ajuster l'apparence
  // ============================================================================
  const buttonStyle = {
    width: isMobile ? '50px' : '45px', // ← MODIFIER pour changer la largeur
    height: isMobile ? '50px' : '45px', // ← MODIFIER pour changer la hauteur
    border: '3px solid white', // ← MODIFIER pour changer la bordure
    color: 'white',
    borderRadius: '50%', // ← MODIFIER pour changer le rayon des coins
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '18px' : '16px', // ← MODIFIER pour changer la taille de police
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)', // ← MODIFIER pour changer l'ombre
    transition: 'all 0.3s ease' // ← MODIFIER pour changer la vitesse d'animation
  };

  // ============================================================================
  // RENDU DU COMPOSANT
  // ============================================================================
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px' // ← MODIFIER pour changer l'espacement entre les boutons
    }}>
     
      {/* BOUTON INTERSECTION DE ZONE */}
      <button
        onClick={handleZoneIntersection}
        title="Analyser l'intersection avec une zone dessinée"
        style={{ ...buttonStyle, background: '#00853f' }} // ← MODIFIER la couleur de fond
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.background = '#006b33';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.background = '#00853f';
        }}
      >
        📐
      </button>

      {/* BOUTON CARTE DE DENSITÉ */}
      <button
        onClick={handleDensityMap}
        title="Afficher la carte de densité des ressources"
        style={{ ...buttonStyle, background: '#17a2b8' }} // ← MODIFIER la couleur de fond
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.background = '#138496';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.background = '#17a2b8';
        }}
      >
        🔥
      </button>
    </div>
  );
};

export default AnalysisToolsBar;