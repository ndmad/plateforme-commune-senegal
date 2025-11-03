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
  // FONCTIONS POUR LE FORMULAIRE (déclarées avec useCallback)
  // ============================================================================
  
  const saveFormData = React.useCallback((elementId) => {
    console.log('🔄 Tentative de sauvegarde pour:', elementId);
    
    // Récupérer les valeurs du formulaire
    const nomInput = document.getElementById(`nom-${elementId}`);
    const typeSelect = document.getElementById(`type-${elementId}`);
    const descriptionTextarea = document.getElementById(`description-${elementId}`);
    
    if (!nomInput || !typeSelect) {
      console.error('❌ Éléments du formulaire non trouvés');
      return;
    }
    
    const nom = nomInput.value || 'Sans nom';
    const type = typeSelect.value || 'Non spécifié';
    const description = descriptionTextarea ? descriptionTextarea.value : 'Aucune description';
    
    console.log('📝 Données à sauvegarder:', { nom, type, description });
    
    // Trouver le layer correspondant
    const layerId = parseInt(elementId.split('_')[1]);
    const layer = Array.from(window.drawnItems?.getLayers() || []).find(l => 
      l._leaflet_id === layerId
    );
    
    if (layer) {
      console.log('✅ Layer trouvé:', layer);
      
      // Calculer les propriétés géométriques selon le type
      let proprietesGeometriques = {};
      
      switch (layer.options.layerType) {
        case 'polygon':
          proprietesGeometriques = {
            surface_km2: (L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) / 1000000).toFixed(2),
            perimetre_km: layer.getLatLngs()[0].reduce((total, latLng, idx, arr) => 
              total + latLng.distanceTo(arr[(idx + 1) % arr.length]) / 1000, 0).toFixed(2),
            nombre_cotes: layer.getLatLngs()[0].length
          };
          break;
          
        case 'polyline':
          proprietesGeometriques = {
            longueur_km: layer.getLatLngs().reduce((total, latLngs) => {
              if (latLngs.length > 1) {
                for (let i = 1; i < latLngs.length; i++) {
                  total += latLngs[i-1].distanceTo(latLngs[i]) / 1000;
                }
              }
              return total;
            }, 0).toFixed(2),
            nombre_points: layer.getLatLngs().flat().length
          };
          break;
          
        case 'marker':
          const coords = layer.getLatLng();
          proprietesGeometriques = {
            latitude: coords.lat.toFixed(6),
            longitude: coords.lng.toFixed(6)
          };
          break;
          
        case 'rectangle':
          const bounds = layer.getBounds();
          proprietesGeometriques = {
            surface_km2: (L.GeometryUtil.geodesicArea([
              bounds.getSouthWest(),
              bounds.getSouthEast(),
              bounds.getNorthEast(),
              bounds.getNorthWest()
            ]) / 1000000).toFixed(2),
            centre_lat: bounds.getCenter().lat.toFixed(6),
            centre_lng: bounds.getCenter().lng.toFixed(6)
          };
          break;
      }
      
      // Stocker les données dans le layer
      layer.formData = {
        // Données du formulaire
        id: elementId,
        nom: nom,
        type: type,
        description: description,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString(),
        
        // Propriétés géométriques
        ...proprietesGeometriques,
        
        // Métadonnées
        layer_type: layer.options.layerType,
        leaflet_id: layer._leaflet_id
      };
      
      // Mettre à jour le popup avec les nouvelles informations
      const infoContent = generateInfoContent(layer, layer.options.layerType);
      layer.bindPopup(infoContent);
      
      console.log('✅ Données sauvegardées avec propriétés géométriques:', layer.formData);
      
      // Fermer le popup du formulaire
      layer.closePopup();
      
      // Afficher un message de confirmation
      setTimeout(() => {
        L.popup()
          .setLatLng(layer.getCenter ? layer.getCenter() : layer.getLatLng())
          .setContent(`
            <div style="text-align: center; padding: 10px;">
              <div style="color: #00853f; font-size: 24px; margin-bottom: 10px;">✅</div>
              <p><strong>Données sauvegardées !</strong></p>
              <small>${nom} - ${type}</small>
              <br/>
              <small style="color: #666; font-size: 10px;">
                Exportez en GeoJSON pour voir les données dans QGIS
              </small>
            </div>
          `)
          .openOn(mapRef.current);
      }, 100);
    } else {
      console.error('❌ Layer non trouvé pour ID:', layerId);
    }
  }, [mapRef]);

  const closeFormPopup = React.useCallback(() => {
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
  }, [mapRef]);

  const editFormData = React.useCallback((elementId) => {
    console.log('✏️ Édition des données pour:', elementId);
    
    const layerId = parseInt(elementId.split('_')[1]);
    const layer = Array.from(window.drawnItems?.getLayers() || []).find(l => 
      l.formData && l.formData.id === elementId
    );
    
    if (layer && layer.formData) {
      const formHtml = createFormPopup(layer, layer.options.layerType);
      
      // Créer un élément temporaire pour manipuler le HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formHtml;
      
      // Pré-remplir les champs avec les données existantes
      const nomInput = tempDiv.querySelector(`#nom-${elementId}`);
      const typeSelect = tempDiv.querySelector(`#type-${elementId}`);
      const descriptionTextarea = tempDiv.querySelector(`#description-${elementId}`);
      
      if (nomInput) nomInput.value = layer.formData.nom;
      if (typeSelect) typeSelect.value = layer.formData.type;
      if (descriptionTextarea) descriptionTextarea.value = layer.formData.description;
      
      // Ouvrir le popup de formulaire
      layer.bindPopup(tempDiv.innerHTML).openPopup();
    }
  }, []);

  // ============================================================================
  // FONCTION POUR GÉNÉRER LE FORMULAIRE
  // ============================================================================
  const createFormPopup = (layer, layerType) => {
    // Générer un ID unique basé sur l'ID Leaflet du layer
    const elementId = `dessin_${layer._leaflet_id}`;
    
    const formHtml = `
      <div style="padding: 15px; min-width: 250px; font-family: Arial, sans-serif;">
        <h4 style="color: #00853f; margin-bottom: 15px; text-align: center;">📝 Formulaire Dessin</h4>
        
        <form id="form-${elementId}">
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #333;">
              Identifiant:
            </label>
            <input 
              type="text" 
              id="id-${elementId}" 
              value="${elementId}"
              style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; background: #f5f5f5;"
              readonly
            />
          </div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #333;">
              Nom: *
            </label>
            <input 
              type="text" 
              id="nom-${elementId}" 
              placeholder="Entrez un nom..."
              style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;"
              required
            />
          </div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #333;">
              Type: *
            </label>
            <select 
              id="type-${elementId}" 
              style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;"
              required
            >
              <option value="">Sélectionnez un type</option>
              <option value="zone_etude">Zone d'étude</option>
              <option value="projet">Projet</option>
              <option value="ressource">Ressource</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: bold; margin-bottom: 4px; color: #333;">
              Description:
            </label>
            <textarea 
              id="description-${elementId}" 
              placeholder="Description de l'élément..."
              rows="3"
              style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; resize: vertical;"
            ></textarea>
          </div>
          
          <div style="display: flex; gap: 8px; justify-content: space-between;">
            <button 
              type="button" 
              onclick="window.drawingSaveFormData('${elementId}')"
              style="flex: 1; padding: 8px 12px; background: #00853f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;"
            >
              💾 Sauvegarder
            </button>
            <button 
              type="button" 
              onclick="window.drawingCloseFormPopup()"
              style="flex: 1; padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
            >
              ❌ Annuler
            </button>
          </div>
          
          <div style="margin-top: 10px; font-size: 10px; color: #666; text-align: center;">
            * Champs obligatoires
          </div>
        </form>
      </div>
    `;
    
    return formHtml;
  };

  // ============================================================================
  // FONCTION POUR GÉNÉRER LE CONTENU INFORMATIF
  // ============================================================================
  const generateInfoContent = (layer, layerType) => {
    const formData = layer.formData;
    
    if (formData) {
      return `
        <div style="padding: 12px; min-width: 220px; font-family: Arial, sans-serif;">
          <h4 style="color: #00853f; margin-bottom: 10px; text-align: center;">${formData.nom}</h4>
          
          <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <strong>Type:</strong> ${formData.type}<br/>
            <strong>ID:</strong> ${formData.id}
          </div>
          
          ${formData.description ? `<p style="margin: 8px 0; font-size: 12px;"><strong>Description:</strong> ${formData.description}</p>` : ''}
          
          <div style="font-size: 10px; color: #666; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
            Créé le: ${new Date(formData.dateCreation).toLocaleDateString('fr-FR')}
          </div>
          
          <button 
            onclick="window.drawingEditFormData('${formData.id}')"
            style="width: 100%; margin-top: 8px; padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;"
          >
            ✏️ Modifier
          </button>
        </div>
      `;
    }
    
    // Retourner le contenu technique si pas de données de formulaire
    return generateTechnicalContent(layer, layerType);
  };

  // ============================================================================
  // FONCTION POUR GÉNÉRER LE CONTENU TECHNIQUE
  // ============================================================================
  const generateTechnicalContent = (layer, layerType) => {
    let content = '';
    
    switch (layerType) {
      case 'marker':
        const markerLatLng = layer.getLatLng();
        content = `
          <div style="padding: 10px; text-align: center;">
            <strong>📍 Marqueur</strong><br/>
            <small>Lat: ${markerLatLng.lat.toFixed(6)}°</small><br/>
            <small>Lng: ${markerLatLng.lng.toFixed(6)}°</small>
            <br/><br/>
            <em style="color: #888; font-size: 10px;">Double-cliquez pour ajouter des informations</em>
          </div>
        `;
        break;
        
      case 'polyline':
        const length = layer.getLatLngs().reduce((total, latLngs) => {
          if (latLngs.length > 1) {
            for (let i = 1; i < latLngs.length; i++) {
              total += latLngs[i-1].distanceTo(latLngs[i]) / 1000;
            }
          }
          return total;
        }, 0);
        content = `
          <div style="padding: 10px; text-align: center;">
            <strong>📏 Ligne</strong><br/>
            <small>Longueur: ${length.toFixed(2)} km</small><br/>
            <small>Points: ${layer.getLatLngs().flat().length}</small>
            <br/><br/>
            <em style="color: #888; font-size: 10px;">Double-cliquez pour ajouter des informations</em>
          </div>
        `;
        break;
        
      case 'polygon':
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) / 1000000;
        const perimeter = layer.getLatLngs()[0].reduce((total, latLng, index, array) => {
          const nextLatLng = array[(index + 1) % array.length];
          return total + latLng.distanceTo(nextLatLng) / 1000;
        }, 0);
        content = `
          <div style="padding: 10px; text-align: center;">
            <strong>🔷 Polygone</strong><br/>
            <small>Surface: ${area.toFixed(2)} km²</small><br/>
            <small>Périmètre: ${perimeter.toFixed(2)} km</small><br/>
            <small>Côtés: ${layer.getLatLngs()[0].length}</small>
            <br/><br/>
            <em style="color: #888; font-size: 10px;">Double-cliquez pour ajouter des informations</em>
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
        content = `
          <div style="padding: 10px; text-align: center;">
            <strong>⬜ Rectangle</strong><br/>
            <small>Surface: ${rectArea.toFixed(2)} km²</small><br/>
            <small>Centre: ${rectCenter.lat.toFixed(6)}°, ${rectCenter.lng.toFixed(6)}°</small><br/>
            <small>Largeur: ${(rectBounds.getNorthEast().lng - rectBounds.getSouthWest().lng).toFixed(4)}°</small>
            <br/><br/>
            <em style="color: #888; font-size: 10px;">Double-cliquez pour ajouter des informations</em>
          </div>
        `;
        break;
        
      default:
        content = `
          <div style="padding: 10px;">
            <strong>Élément dessiné</strong>
            <br/><br/>
            <em style="color: #888; font-size: 10px;">Double-cliquez pour ajouter des informations</em>
          </div>
        `;
    }
    
    return content;
  };

  // ============================================================================
  // FONCTION POUR EXPORTER LES DESSINS AVEC DONNÉES ATTRIBUTAIRES
  // ============================================================================
  const handleExportDrawings = () => {
    if (!drawnItems || drawnItems.getLayers().length === 0) {
      alert('Aucun élément dessiné à exporter');
      return;
    }

    try {
      // Convertir en GeoJSON
      const geoJSON = drawnItems.toGeoJSON();
      
      console.log('📊 Export GeoJSON - Features avant traitement:', geoJSON.features.length);
      
      // Ajouter les données attributaires à chaque feature
      geoJSON.features.forEach((feature, index) => {
        // Trouver le layer correspondant
        const layer = Array.from(drawnItems.getLayers())[index];
        
        console.log(`🔍 Traitement feature ${index}:`, {
          layerId: layer?._leaflet_id,
          hasFormData: !!layer?.formData,
          formData: layer?.formData
        });
        
        // Initialiser les propriétés si elles n'existent pas
        if (!feature.properties) {
          feature.properties = {};
        }
        
        // Ajouter les données de base du dessin
        feature.properties.layer_type = layer?.options?.layerType || 'unknown';
        feature.properties.leaflet_id = layer?._leaflet_id || 'unknown';
        feature.properties.export_date = new Date().toISOString();
        
        // Ajouter les données du formulaire si elles existent
        if (layer && layer.formData) {
          feature.properties = {
            ...feature.properties,
            // Données du formulaire
            id_form: layer.formData.id || '',
            nom_form: layer.formData.nom || '',
            type_form: layer.formData.type || '',
            description_form: layer.formData.description || '',
            date_creation: layer.formData.dateCreation || '',
            date_modification: layer.formData.dateModification || '',
            
            // Propriétés géométriques
            ...(layer.formData.surface_km2 && { surface_km2: layer.formData.surface_km2 }),
            ...(layer.formData.perimetre_km && { perimetre_km: layer.formData.perimetre_km }),
            ...(layer.formData.longueur_km && { longueur_km: layer.formData.longueur_km }),
            ...(layer.formData.latitude && { latitude: layer.formData.latitude }),
            ...(layer.formData.longitude && { longitude: layer.formData.longitude }),
            ...(layer.formData.centre_lat && { centre_lat: layer.formData.centre_lat }),
            ...(layer.formData.centre_lng && { centre_lng: layer.formData.centre_lng }),
            ...(layer.formData.nombre_cotes && { nombre_cotes: layer.formData.nombre_cotes }),
            ...(layer.formData.nombre_points && { nombre_points: layer.formData.nombre_points })
          };
        } else {
          // Si pas de données de formulaire, ajouter des propriétés par défaut
          feature.properties.etat_formulaire = 'non_rempli';
          feature.properties.nom_form = 'Element sans nom';
          feature.properties.type_form = 'non_specifie';
        }
      });
      
      console.log('📊 GeoJSON final:', JSON.stringify(geoJSON, null, 2));
      
      // Créer le fichier à télécharger
      const dataStr = JSON.stringify(geoJSON, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `dessins-carte-${new Date().toISOString().split('T')[0]}.geojson`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      console.log('✅ Dessins exportés en GeoJSON avec données attributaires');
      
      // Afficher un récapitulatif
      const elementsAvecFormulaire = Array.from(drawnItems.getLayers()).filter(l => l.formData).length;
      
      L.popup()
        .setLatLng(mapRef.current.getCenter())
        .setContent(`
          <div style="text-align: center; padding: 15px; min-width: 250px;">
            <div style="color: #00853f; font-size: 24px; margin-bottom: 10px;">✅</div>
            <p><strong>Export réussi !</strong></p>
            <div style="text-align: left; margin-top: 10px; font-size: 12px;">
              <p><strong>Récapitulatif :</strong></p>
              <p>• Éléments exportés: ${drawnItems.getLayers().length}</p>
              <p>• Avec formulaire: ${elementsAvecFormulaire}</p>
              <p>• Sans formulaire: ${drawnItems.getLayers().length - elementsAvecFormulaire}</p>
              <p style="margin-top: 10px; color: #666; font-size: 10px;">
                Les données sont dans la table attributaire du GeoJSON
              </p>
            </div>
          </div>
        `)
        .openOn(mapRef.current);
        
    } catch (error) {
      console.error('❌ Erreur export dessins:', error);
      alert('Erreur lors de l\'export des dessins: ' + error.message);
    }
  };

  // ============================================================================
  // INITIALISATION DES OUTILS DE DESSIN LEAFLET
  // ============================================================================
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialiser le groupe pour les éléments dessinés
    const drawnItemsGroup = new L.FeatureGroup();
    setDrawnItems(drawnItemsGroup);
    mapRef.current.addLayer(drawnItemsGroup);

    // Exposer les fonctions globales avec des noms uniques
    window.drawingSaveFormData = saveFormData;
    window.drawingCloseFormPopup = closeFormPopup;
    window.drawingEditFormData = editFormData;

    console.log('✅ Fonctions globales exposées');

    // Charger leaflet-draw depuis CDN si pas disponible
    if (!L.Control.Draw) {
      console.log('📦 Chargement de Leaflet.Draw depuis CDN...');
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
      script.onload = initializeDrawControl;
      document.head.appendChild(script);
    } else {
      initializeDrawControl();
    }

    function initializeDrawControl() {
      console.log('✅ Initialisation des outils de dessin Leaflet');
      
      if (window.existingDrawControl) {
        mapRef.current.removeControl(window.existingDrawControl);
      }
      
      const control = new L.Control.Draw({
        position: 'bottomleft',
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
      window.existingDrawControl = control;
      mapRef.current.addControl(control);

      // Gérer les événements de dessin
      mapRef.current.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        drawnItemsGroup.addLayer(layer);
        window.drawnItems = drawnItemsGroup;
        
        // Stocker le type de layer
        layer.options.layerType = e.layerType;
        
        // Attacher le popup initial
        const initialContent = generateTechnicalContent(layer, e.layerType);
        layer.bindPopup(initialContent);
        
        // Ajouter l'événement de double-clic
        layer.on('dblclick', function() {
          console.log('🖱️ Double-clic sur le layer:', layer._leaflet_id);
          const formHtml = createFormPopup(layer, e.layerType);
          layer.bindPopup(formHtml).openPopup();
        });
        
        // Ouvrir le popup automatiquement
        layer.openPopup();
        
        console.log('✅ Élément dessiné ajouté:', e.layerType, 'ID:', layer._leaflet_id);
      });

      mapRef.current.on(L.Draw.Event.EDITED, (e) => {
        console.log('✏️ Élément modifié');
        e.layers.eachLayer(function(layer) {
          if (layer.formData) {
            layer.formData.dateModification = new Date().toISOString();
          }
        });
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

    return () => {
      if (mapRef.current && drawControl) {
        mapRef.current.removeControl(drawControl);
        delete window.existingDrawControl;
      }
      if (drawnItemsGroup && mapRef.current?.hasLayer(drawnItemsGroup)) {
        mapRef.current.removeLayer(drawnItemsGroup);
      }
      // Nettoyer les fonctions globales
      delete window.drawingSaveFormData;
      delete window.drawingCloseFormPopup;
      delete window.drawingEditFormData;
      delete window.drawnItems;
    };
  }, [mapRef, saveFormData, closeFormPopup, editFormData]);

  // ============================================================================
  // FONCTIONS DE GESTION DES DESSINS
  // ============================================================================

  const handleClearDrawings = () => {
    if (drawnItems && drawnItems.getLayers().length > 0) {
      if (window.confirm(`Voulez-vous vraiment supprimer tous les ${drawnItems.getLayers().length} éléments dessinés ?`)) {
        drawnItems.clearLayers();
        console.log('🗑️ Tous les dessins effacés');
        
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

  const handlePrintMap = () => {
    if (!mapRef.current) return;

    try {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('fr-FR');
      const center = mapRef.current.getCenter();
      
      const elementsAvecFormulaire = drawnItems ? 
        Array.from(drawnItems.getLayers()).filter(l => l.formData).length : 0;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Carte des Ressources - Impression</title>
            <style>
              body { margin: 20px; font-family: Arial, sans-serif; color: #333; }
              .print-header { text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #00853f; }
              .print-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .map-screenshot { width: 100%; height: 400px; background: #f0f0f0; border: 2px solid #00853f; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 20px 0; color: #666; }
              .no-print { text-align: center; margin-top: 20px; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1 style="color: #00853f; margin-bottom: 10px;">Carte des Ressources Communales</h1>
              <p style="color: #666;">Généré le ${currentDate}</p>
            </div>
            
            <div class="print-info">
              <p><strong>Nombre de ressources:</strong> ${window.ressourcesCount || 0}</p>
              <p><strong>Éléments dessinés:</strong> ${drawnItems ? drawnItems.getLayers().length : 0}</p>
              <p><strong>Éléments documentés:</strong> ${elementsAvecFormulaire}</p>
              <p><strong>Échelle:</strong> ${mapRef.current.getZoom()}</p>
              <p><strong>Centre de la carte:</strong> Lat ${center.lat.toFixed(4)}°, Lng ${center.lng.toFixed(4)}°</p>
            </div>
            
            <div class="map-screenshot">
              <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
                <p><strong>Capture d'écran de la carte</strong></p>
                <small>La carte interactive ne peut pas être imprimée directement</small>
              </div>
            </div>
            
            <div class="no-print">
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
  // STYLES DES BOUTONS
  // ============================================================================
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

  // ============================================================================
  // RENDU DU COMPOSANT
  // ============================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button 
        onClick={handleExportDrawings}
        title="Exporter les dessins en GeoJSON"
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
        💾
      </button>

      <button 
        onClick={handleClearDrawings}
        title="Effacer tous les dessins"
        style={{ ...buttonStyle, background: '#dc3545' }}
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

      <button 
        onClick={handlePrintMap}
        title="Imprimer la carte"
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
        🖨️
      </button>
    </div>
  );
};

export default DrawingAndPrintTools;