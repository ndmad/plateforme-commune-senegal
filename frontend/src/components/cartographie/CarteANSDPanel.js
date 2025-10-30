import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Badge, Button, Container, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, GeoJSON, Popup, LayersControl, CircleMarker, Tooltip } from 'react-leaflet';
import { useNotifications } from '../Notifications';
import { API_BASE_URL } from '../../config';
import 'leaflet/dist/leaflet.css';

const { BaseLayer, Overlay } = LayersControl;

const CarteANSDPanel = () => {
  const [indicateurActif, setIndicateurActif] = useState('population');
  const [donneesCommunes, setDonneesCommunes] = useState({});
  const [geoData, setGeoData] = useState(null);
  const [ressources, setRessources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couchesActives, setCouchesActives] = useState({
    indicateurs: true,
    ressources: true,
    analyse: false
  });
  const { error } = useNotifications();

  const indicateurs = [
    { id: 'population', nom: '👥 Population', champ: 'total' },
    { id: 'density', nom: '📏 Densité', champ: 'density' },
    { id: 'chomage', nom: '💼 Chômage', champ: 'taux_chomage' },
    { id: 'idh', nom: '📊 IDH', champ: 'idh' },
    { id: 'pauvreté', nom: '🏚️ Pauvreté', champ: 'pauvreté' },
    { id: 'acces_eau', nom: '💧 Accès Eau', champ: 'acces_eau' }
  ];

  const typesRessources = {
    'Agricole': { couleur: '#27ae60', icone: '🌾' },
    'Hydrique': { couleur: '#3498db', icone: '💧' },
    'Économique': { couleur: '#e74c3c', icone: '🏪' },
    'Social': { couleur: '#9b59b6', icone: '👥' },
    'Touristique': { couleur: '#f39c12', icone: '🏞️' }
  };

  useEffect(() => {
    loadDonneesCartographiques();
    loadRessources();
  }, []);

  const loadDonneesCartographiques = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/ansd/statistiques-globales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDonneesCommunes(data.data);
        const geoDataSimule = genererGeoDataSimulee(data.data);
        setGeoData(geoDataSimule);
      }
    } catch (err) {
      error('Erreur chargement données cartographiques');
    } finally {
      setLoading(false);
    }
  };

  const loadRessources = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ressources`);
      if (response.ok) {
        const data = await response.json();
        setRessources(data.data || []);
      }
    } catch (err) {
      console.error('Erreur chargement ressources:', err);
    }
  };

  const genererGeoDataSimulee = (donnees) => {
    const geometries = {
      'Dakar': { 
        type: 'Polygon', 
        coordinates: [[[-17.4700, 14.6900], [-17.4300, 14.6900], [-17.4300, 14.7300], [-17.4700, 14.7300], [-17.4700, 14.6900]]] 
      },
      'Pikine': { 
        type: 'Polygon', 
        coordinates: [[[-17.4300, 14.7300], [-17.3800, 14.7300], [-17.3800, 14.7800], [-17.4300, 14.7800], [-17.4300, 14.7300]]] 
      },
      'Guediawaye': { 
        type: 'Polygon', 
        coordinates: [[[-17.4300, 14.7800], [-17.4000, 14.7800], [-17.4000, 14.8200], [-17.4300, 14.8200], [-17.4300, 14.7800]]] 
      },
      'Rufisque': { 
        type: 'Polygon', 
        coordinates: [[[-17.3800, 14.6900], [-17.2500, 14.6900], [-17.2500, 14.7800], [-17.3800, 14.7800], [-17.3800, 14.6900]]] 
      }
    };

    return {
      type: 'FeatureCollection',
      features: Object.entries(donnees).map(([commune, data]) => ({
        type: 'Feature',
        properties: {
          name: commune,
          ...data.demographic.population,
          ...data.economic,
          ...data.indicateurs
        },
        geometry: geometries[commune] || geometries['Dakar']
      }))
    };
  };

  // 🔧 ANALYSE SPATIALE - Identification des zones blanches
  const analyserZonesBlanches = () => {
    if (!geoData || !ressources.length) return [];

    const zonesBlanches = [];
    
    geoData.features.forEach(commune => {
      const ressourcesCommune = ressources.filter(res => {
        if (!res.localisation) return false;
        return estDansPolygone(
          [res.localisation.coordinates[1], res.localisation.coordinates[0]],
          commune.geometry.coordinates[0]
        );
      });

      // Si moins de 3 ressources pour une commune de plus de 500k habitants
      if (ressourcesCommune.length < 3 && commune.properties.total > 500000) {
        zonesBlanches.push({
          commune: commune.properties.name,
          ressourcesCount: ressourcesCommune.length,
          population: commune.properties.total,
          indicateur: 'Sous-équipée'
        });
      }
    });

    return zonesBlanches;
  };

  // 🔧 FONCTION : Vérifier si un point est dans un polygone
  const estDansPolygone = (point, vs) => {
    const x = point[0], y = point[1];
    let inside = false;
    
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  const getCouleurIndicateur = (valeur, indicateur) => {
    const palettes = {
      population: ['#f7fbff', '#c6dbef', '#6baed6', '#2171b5', '#08306b'],
      density: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026'],
      chomage: ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026'],
      idh: ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'],
      pauvreté: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#f03b20'],
      acces_eau: ['#f7fcf5', '#c7e9c0', '#74c476', '#31a354', '#006d2c']
    };

    const echelles = {
      population: [0, 250000, 500000, 750000, 1000000],
      density: [0, 5000, 10000, 15000, 20000, 25000, 30000],
      chomage: [0, 10, 15, 20, 25, 30],
      idh: [0, 0.4, 0.5, 0.6, 0.7, 0.8],
      pauvreté: [0, 20, 30, 40, 50, 60],
      acces_eau: [0, 50, 70, 80, 90, 100]
    };

    const palette = palettes[indicateur] || palettes.population;
    const echelle = echelles[indicateur] || echelles.population;
    
    for (let i = 0; i < echelle.length; i++) {
      if (valeur <= echelle[i]) {
        return palette[i] || palette[palette.length - 1];
      }
    }
    return palette[palette.length - 1];
  };

  const styleFeature = (feature) => {
    const indicateur = indicateurs.find(ind => ind.id === indicateurActif);
    const valeur = feature.properties[indicateur?.champ] || 0;
    
    return {
      fillColor: getCouleurIndicateur(valeur, indicateurActif),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: couchesActives.indicateurs ? 0.7 : 0.3
    };
  };

  const formatValeur = (valeur, indicateur) => {
    if (indicateur === 'idh') return valeur.toFixed(3);
    if (['chomage', 'pauvreté', 'acces_eau'].includes(indicateur)) return `${valeur}%`;
    if (['population', 'density'].includes(indicateur)) {
      return new Intl.NumberFormat('fr-FR').format(valeur);
    }
    return valeur;
  };

  const onEachFeature = (feature, layer) => {
    const indicateur = indicateurs.find(ind => ind.id === indicateurActif);
    const valeur = feature.properties[indicateur?.champ] || 0;
    
    const popupContent = `
      <div style="min-width: 250px;">
        <h4>${feature.properties.name}</h4>
        <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
          <strong>${indicateur?.nom}:</strong> ${formatValeur(valeur, indicateurActif)}
        </div>
        <div style="font-size: 12px;">
          <div>👥 Population: ${new Intl.NumberFormat('fr-FR').format(feature.properties.total)}</div>
          <div>💼 Chômage: ${feature.properties.taux_chomage}%</div>
          <div>📊 IDH: ${feature.properties.idh}</div>
          <div>🏚️ Pauvreté: ${feature.properties.pauvreté}%</div>
          <div>💧 Eau: ${feature.properties.acces_eau}%</div>
        </div>
      </div>
    `;
    
    layer.bindPopup(popupContent);
  };

  const zonesBlanches = analyserZonesBlanches();

  if (loading) {
    return (
      <Card className="flutter-card">
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement de la carte ANSD...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Container fluid className="p-0">
      {/* En-tête avec contrôles avancés */}
      <Card className="flutter-card mb-3">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-1">🗺️ Cartographie ANSD - Analyse Spatiale</h4>
              <p className="text-muted mb-0">
                Superposition indicateurs ANSD + ressources communales
              </p>
            </Col>
            <Col xs="auto">
              <Button 
                variant="outline-primary"
                onClick={loadDonneesCartographiques}
              >
                🔄 Actualiser
              </Button>
            </Col>
          </Row>
          
          {/* Sélecteur d'indicateurs */}
          <Row className="mt-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Indicateur à visualiser:</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {indicateurs.map(indicateur => (
                    <Badge
                      key={indicateur.id}
                      bg={indicateurActif === indicateur.id ? 'primary' : 'outline-primary'}
                      className="cursor-pointer p-2"
                      onClick={() => setIndicateurActif(indicateur.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {indicateur.nom}
                    </Badge>
                  ))}
                </div>
              </Form.Group>
            </Col>
            
            {/* Contrôles des couches */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Couches à afficher:</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  <Badge
                    bg={couchesActives.indicateurs ? 'success' : 'outline-secondary'}
                    className="cursor-pointer p-2"
                    onClick={() => setCouchesActives({...couchesActives, indicateurs: !couchesActives.indicateurs})}
                    style={{ cursor: 'pointer' }}
                  >
                    📊 Indicateurs
                  </Badge>
                  <Badge
                    bg={couchesActives.ressources ? 'success' : 'outline-secondary'}
                    className="cursor-pointer p-2"
                    onClick={() => setCouchesActives({...couchesActives, ressources: !couchesActives.ressources})}
                    style={{ cursor: 'pointer' }}
                  >
                    📍 Ressources ({ressources.length})
                  </Badge>
                  <Badge
                    bg={couchesActives.analyse ? 'warning' : 'outline-secondary'}
                    className="cursor-pointer p-2"
                    onClick={() => setCouchesActives({...couchesActives, analyse: !couchesActives.analyse})}
                    style={{ cursor: 'pointer' }}
                  >
                    🔍 Analyse
                  </Badge>
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Alertes zones blanches */}
          {zonesBlanches.length > 0 && couchesActives.analyse && (
            <Alert variant="warning" className="mt-3">
              <strong>🚨 Zones sous-équipées identifiées:</strong>
              <div className="mt-2">
                {zonesBlanches.map((zone, index) => (
                  <Badge key={index} bg="warning" className="me-2">
                    {zone.commune} ({zone.ressourcesCount} ressources)
                  </Badge>
                ))}
              </div>
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Carte - PLEINE LARGEUR AVEC COUCHES */}
      <div className="flutter-card" style={{ height: '70vh', minHeight: '500px' }}>
        <MapContainer
          center={[14.7167, -17.4677]}
          zoom={11}
          style={{ 
            height: '100%', 
            width: '100%',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <LayersControl position="topright">
            <BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
            </BaseLayer>
            
            <BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              />
            </BaseLayer>

            {/* Couche indicateurs ANSD */}
            <Overlay checked={couchesActives.indicateurs} name="Indicateurs ANSD">
              {geoData && (
                <GeoJSON
                  data={geoData}
                  style={styleFeature}
                  onEachFeature={onEachFeature}
                />
              )}
            </Overlay>

            {/* Couche ressources */}
            <Overlay checked={couchesActives.ressources} name="Ressources communales">
              {ressources.map((ressource, index) => {
                if (!ressource.localisation) return null;
                
                const typeConfig = typesRessources[ressource.type] || typesRessources['Social'];
                
                return (
                  <CircleMarker
                    key={index}
                    center={[ressource.localisation.coordinates[1], ressource.localisation.coordinates[0]]}
                    radius={8}
                    fillColor={typeConfig.couleur}
                    color="#fff"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.8}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <h6>{typeConfig.icone} {ressource.nom}</h6>
                        <p className="mb-1"><strong>Type:</strong> {ressource.type}</p>
                        <p className="mb-1"><strong>Potentiel:</strong> {ressource.potentiel}</p>
                        {ressource.description && (
                          <p className="mb-1"><strong>Description:</strong> {ressource.description}</p>
                        )}
                      </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
                      {typeConfig.icone} {ressource.nom}
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </Overlay>

            {/* Couche analyse - zones blanches */}
            {couchesActives.analyse && zonesBlanches.length > 0 && (
              <Overlay name="Zones sous-équipées">
                {geoData && geoData.features.filter(f => 
                  zonesBlanches.some(z => z.commune === f.properties.name)
                ).map((feature, index) => (
                  <GeoJSON
                    key={index}
                    data={feature}
                    style={{
                      fillColor: '#ff6b6b',
                      weight: 3,
                      opacity: 0.8,
                      color: '#ff0000',
                      dashArray: '5, 5',
                      fillOpacity: 0.2
                    }}
                  />
                ))}
              </Overlay>
            )}
          </LayersControl>
        </MapContainer>
      </div>

      {/* Légende avancée */}
      <Card className="flutter-card mt-3">
        <Card.Header>
          <h6 className="mb-0">🎨 Légende et Analyse</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <div className="mb-3">
                <strong>📊 {indicateurs.find(ind => ind.id === indicateurActif)?.nom}</strong>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <div 
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: getCouleurIndicateur(0, indicateurActif),
                      border: '1px solid #ccc',
                      borderRadius: '3px'
                    }}
                  ></div>
                  <small className="text-muted">Faible</small>
                  <div style={{ flex: 1, height: '10px', background: 'linear-gradient(to right, #f7fbff, #08306b)', borderRadius: '5px' }}></div>
                  <small className="text-muted">Élevé</small>
                  <div 
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: getCouleurIndicateur(1000000, indicateurActif),
                      border: '1px solid #ccc',
                      borderRadius: '3px'
                    }}
                  ></div>
                </div>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="mb-3">
                <strong>📍 Types de Ressources</strong>
                <div className="mt-2">
                  {Object.entries(typesRessources).map(([type, config]) => (
                    <div key={type} className="d-flex align-items-center gap-2 mb-1">
                      <div 
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: config.couleur,
                          borderRadius: '50%'
                        }}
                      ></div>
                      <small>{config.icone} {type}</small>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="mb-3">
                <strong>🔍 Analyse Spatiale</strong>
                <div className="mt-2">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <div 
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#ff6b6b',
                        borderRadius: '50%'
                      }}
                    ></div>
                    <small>Zones sous-équipées</small>
                  </div>
                  {zonesBlanches.length > 0 && (
                    <div className="mt-2">
                      <small className="text-warning">
                        🚨 {zonesBlanches.length} zone(s) prioritaire(s) identifiée(s)
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CarteANSDPanel;