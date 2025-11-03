import React, { useState, useEffect } from 'react';
import L from 'leaflet';


// Fonction utilitaire pour calculer la surface d'un polygone
const calculatePolygonArea = (latLngs) => {
    if (!latLngs || latLngs.length < 3) return 0;
    
    let area = 0;
    const len = latLngs.length;
    
    for (let i = 0; i < len; i++) {
      const p1 = latLngs[i];
      const p2 = latLngs[(i + 1) % len];
      area += (p2.lng - p1.lng) * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
    }
    
    return Math.abs(area * 6378137 * 6378137 / (2 * 1000000)); // en km²
  };


const DrawingAndPrintTools = ({ isMobile, mapRef }) => {
  const [drawnItems, setDrawnItems] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawControl, setDrawControl] = useState(null);

  // ============================================================================
  // INITIALISATION DES OUTILS DE DESSIN LEAFLET
  // ============================================================================
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialiser le groupe pour les éléments dessinés
    const drawnItemsGroup = new L.FeatureGroup();
    setDrawnItems(drawnItemsGroup);
    mapRef.current.addLayer(drawnItemsGroup);

    // Charger leaflet-draw depuis CDN si pas disponible
    if (!L.Control.Draw) {
      console.log('📦 Chargement de Leaflet.Draw depuis CDN...');
      
      // Charger le CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
      document.head.appendChild(link);
      
      // Charger le JS
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
      script.onload = initializeDrawControl;
      document.head.appendChild(script);
    } else {
      initializeDrawControl();
    }

    function initializeDrawControl() {
      console.log('✅ Initialisation des outils de dessin Leaflet');
      
      // Vérifier si un contrôle de dessin existe déjà et le supprimer
      if (window.existingDrawControl) {
        mapRef.current.removeControl(window.existingDrawControl);
      }
      
      // Configuration des outils de dessin Leaflet
      const control = new L.Control.Draw({
        position: 'bottomleft', // Position des outils natifs Leaflet (à gauche)
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: 'Les polygones ne peuvent pas se croiser'
            },
            shapeOptions: {
              color: '#00853f',
              fillColor: '#00853f',
              fillOpacity: 0.2
            },
            showArea: true,
            metric: true
          },
          polyline: {
            shapeOptions: {
              color: '#00853f',
              weight: 4
            },
            showLength: true,
            metric: true
          },
          circle: false,
          rectangle: {
            shapeOptions: {
              color: '#00853f',
              fillColor: '#00853f',
              fillOpacity: 0.2
            },
            showArea: true,
            metric: true
          },
          marker: {
            icon: new L.Icon({
              iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png`,
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41]
            })
          },
          circlemarker: false
        },
        edit: {
          featureGroup: drawnItemsGroup,
          remove: true
        }
      });

      

      setDrawControl(control);
      window.existingDrawControl = control; // Stocker la référence
      mapRef.current.addControl(control);

      // Gérer les événements de dessin
      // Remplacer la section L.Draw.Event.CREATED existante par ceci :
mapRef.current.on(L.Draw.Event.CREATED, (e) => {
    const layer = e.layer;
    drawnItemsGroup.addLayer(layer);
    window.drawnItems = drawnItemsGroup;
    
    let popupContent = '';
    
    // Gérer chaque type d'élément dessiné
    switch (e.layerType) {
      case 'marker':
        const markerLatLng = layer.getLatLng();
        popupContent = `
          <div style="padding: 10px; text-align: center;">
            <strong>📍 Marqueur</strong><br/>
            <small>Lat: ${markerLatLng.lat.toFixed(6)}°</small><br/>
            <small>Lng: ${markerLatLng.lng.toFixed(6)}°</small>
          </div>
        `;
        break;
        
      case 'polyline':
        const length = layer.getLatLngs().reduce((total, latLngs) => {
          // Calculer la longueur approximative en km
          if (latLngs.length > 1) {
            for (let i = 1; i < latLngs.length; i++) {
              total += latLngs[i-1].distanceTo(latLngs[i]) / 1000;
            }
          }
          return total;
        }, 0);
        popupContent = `
          <div style="padding: 10px; text-align: center;">
            <strong>📏 Ligne</strong><br/>
            <small>Longueur: ${length.toFixed(2)} km</small><br/>
            <small>Points: ${layer.getLatLngs().flat().length}</small>
          </div>
        `;
        break;
        
      case 'polygon':
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) / 1000000; // en km²
        const perimeter = layer.getLatLngs()[0].reduce((total, latLng, index, array) => {
          const nextLatLng = array[(index + 1) % array.length];
          return total + latLng.distanceTo(nextLatLng) / 1000;
        }, 0);
        popupContent = `
          <div style="padding: 10px; text-align: center;">
            <strong>🔷 Polygone</strong><br/>
            <small>Surface: ${area.toFixed(2)} km²</small><br/>
            <small>Périmètre: ${perimeter.toFixed(2)} km</small><br/>
            <small>Côtés: ${layer.getLatLngs()[0].length}</small>
          </div>
        `;
        break;
        
      case 'rectangle':
        const rectBounds = layer.getBounds();
        const rectArea = L.GeometryUtil.geodesicArea([
          rectBounds.getSouthWest(),
          rectBounds.getSouthEast(),
          rectBounds.getNorthEast(),
          rectBounds.getNorthWest()
        ]) / 1000000;
        const rectCenter = rectBounds.getCenter();
        popupContent = `
          <div style="padding: 10px; text-align: center;">
            <strong>⬜ Rectangle</strong><br/>
            <small>Surface: ${rectArea.toFixed(2)} km²</small><br/>
            <small>Centre: ${rectCenter.lat.toFixed(6)}°, ${rectCenter.lng.toFixed(6)}°</small><br/>
            <small>Largeur: ${rectBounds.getNorthEast().lng - rectBounds.getSouthWest().lng.toFixed(4)}°</small>
          </div>
        `;
        break;
        
      default:
        popupContent = `<div style="padding: 10px;"><strong>Élément dessiné</strong></div>`;
    }
    
    // Attacher le popup à l'élément
    layer.bindPopup(popupContent);
    
    // Ouvrir le popup automatiquement
    layer.openPopup();
    
    console.log('✅ Élément dessiné ajouté:', e.layerType);
  });


      mapRef.current.on(L.Draw.Event.EDITED, (e) => {
        console.log('✏️ Élément modifié');
      });

      mapRef.current.on(L.Draw.Event.DELETED, (e) => {
        console.log('🗑️ Élément(s) supprimé(s)');
      });

      mapRef.current.on(L.Draw.Event.DRAWSTART, (e) => {
        setIsDrawing(true);
        console.log('🎨 Début du dessin:', e.layerType);
      });

      mapRef.current.on(L.Draw.Event.DRAWSTOP, (e) => {
        setIsDrawing(false);
        console.log('🛑 Fin du dessin');
      });
    }

    // Nettoyage à la destruction du composant
    return () => {
      if (mapRef.current && drawControl) {
        mapRef.current.removeControl(drawControl);
        delete window.existingDrawControl;
      }
      if (drawnItemsGroup && mapRef.current?.hasLayer(drawnItemsGroup)) {
        mapRef.current.removeLayer(drawnItemsGroup);
      }
      delete window.drawnItems;
    };
  }, [mapRef]);

  // ============================================================================
  // FONCTIONS POUR ACTIVER LE DESSIN
  // ============================================================================
  const activateDrawing = (type) => {
    if (!drawControl) {
      alert('Outils de dessin non encore chargés. Veuillez patienter...');
      return;
    }
    
    // Simuler un clic sur le bouton de dessin correspondant
    const drawToolbar = document.querySelector('.leaflet-draw-draw-' + type);
    if (drawToolbar) {
      drawToolbar.click();
    } else {
      alert(`Outil de dessin "${type}" non trouvé. Les outils devraient apparaître en haut à gauche de la carte.`);
    }
  };

  // ============================================================================
  // FONCTIONS DE GESTION DES DESSINS
  // ============================================================================

  // Fonction pour exporter les dessins en GeoJSON
  const handleExportDrawings = () => {
    if (!drawnItems || drawnItems.getLayers().length === 0) {
      alert('Aucun élément dessiné à exporter');
      return;
    }

    try {
      const geoJSON = drawnItems.toGeoJSON();
      const dataStr = JSON.stringify(geoJSON, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `dessins-carte-${new Date().toISOString().split('T')[0]}.geojson`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      console.log('✅ Dessins exportés en GeoJSON');
      
      // Afficher une confirmation
      L.popup()
        .setLatLng(mapRef.current.getCenter())
        .setContent(`
          <div style="text-align: center; padding: 10px;">
            <div style="color: #00853f; font-size: 24px; margin-bottom: 10px;">✅</div>
            <p><strong>Export réussi !</strong></p>
            <small>${drawnItems.getLayers().length} éléments exportés</small>
          </div>
        `)
        .openOn(mapRef.current);
        
    } catch (error) {
      console.error('❌ Erreur export dessins:', error);
      alert('Erreur lors de l\'export des dessins');
    }
  };

  // Fonction pour effacer tous les dessins
  const handleClearDrawings = () => {
    if (drawnItems && drawnItems.getLayers().length > 0) {
      if (window.confirm(`Voulez-vous vraiment supprimer tous les ${drawnItems.getLayers().length} éléments dessinés ?`)) {
        drawnItems.clearLayers();
        console.log('🗑️ Tous les dessins effacés');
        
        // Afficher une confirmation
        L.popup()
          .setLatLng(mapRef.current.getCenter())
          .setContent(`
            <div style="text-align: center; padding: 10px;">
              <div style="color: #00853f; font-size: 24px; margin-bottom: 10px;">🗑️</div>
              <p><strong>Tous les dessins ont été supprimés</strong></p>
            </div>
          `)
          .openOn(mapRef.current);
      }
    } else {
      alert('Aucun élément dessiné à supprimer');
    }
  };

  // Fonction pour imprimer la carte
  const handlePrintMap = () => {
    if (!mapRef.current) return;

    try {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('fr-FR');
      const center = mapRef.current.getCenter();
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Carte des Ressources - Impression</title>
            <style>
              body { 
                margin: 20px; 
                font-family: Arial, sans-serif; 
                color: #333;
              }
              .print-header { 
                text-align: center; 
                margin-bottom: 20px; 
                padding-bottom: 20px; 
                border-bottom: 2px solid #00853f; 
              }
              .print-info { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 20px 0; 
              }
              .map-screenshot {
                width: 100%;
                height: 400px;
                background: #f0f0f0;
                border: 2px solid #00853f;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 20px 0;
                color: #666;
              }
              .no-print { 
                text-align: center;
                margin-top: 20px; 
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1 style="color: #00853f; margin-bottom: 10px;">Carte des Ressources Communales</h1>
              <p style="color: #666;">Généré le ${currentDate}</p>
            </div>
            
            <div class="print-info">
              <p><strong>Nombre de ressources:</strong> ${window.ressourcesCount || 0}</p>
              <p><strong>Échelle:</strong> ${mapRef.current.getZoom()}</p>
              <p><strong>Centre de la carte:</strong> Lat ${center.lat.toFixed(4)}°, Lng ${center.lng.toFixed(4)}°</p>
              <p><strong>Éléments dessinés:</strong> ${drawnItems ? drawnItems.getLayers().length : 0}</p>
            </div>
            
            <div class="map-screenshot">
              <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
                <p><strong>Capture d'écran de la carte</strong></p>
                <small>La carte interactive ne peut pas être imprimée directement</small>
                <br>
                <small>Utilisez la fonction de capture d'écran de votre navigateur</small>
              </div>
            </div>
            
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #00853f; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin: 5px;">
                🖨️ Imprimer cette page
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
                Fermer la fenêtre
              </button>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
    } catch (error) {
      console.error('❌ Erreur impression:', error);
      alert('Erreur lors de l\'impression de la carte');
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
    
      {/* BOUTON D'EXPORT */}
      <button
        onClick={handleExportDrawings}
        title="Exporter les dessins en GeoJSON"
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
        💾
      </button>

      {/* BOUTON DE SUPPRESSION */}
      <button
        onClick={handleClearDrawings}
        title="Effacer tous les dessins"
        style={{ ...buttonStyle, background: '#dc3545' }} // ← MODIFIER la couleur de fond
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.background = '#c82333';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.background = '#dc3545';
        }}
      >
        🗑️
      </button>

      {/* BOUTON D'IMPRESSION */}
      <button
        onClick={handlePrintMap}
        title="Imprimer la carte"
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
        🖨️
      </button>
    </div>
  );
};

export default DrawingAndPrintTools;