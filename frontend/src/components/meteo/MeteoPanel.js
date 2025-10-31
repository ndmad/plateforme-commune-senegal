// frontend/src/components/meteo/MeteoPanel.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Alert, Button, Spinner } from 'react-bootstrap';
import { useNotifications } from '../Notifications';
import { API_BASE_URL } from '../../config';

const MeteoPanel = () => {
  const [donneesMeteo, setDonneesMeteo] = useState(null);
  const [communeSelectionnee, setCommuneSelectionnee] = useState('Dakar');
  const [loading, setLoading] = useState(true);
  const { success, error } = useNotifications();

  const communes = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Saint-Louis'];

  useEffect(() => {
    chargerMeteo(communeSelectionnee);
  }, [communeSelectionnee]);

  const chargerMeteo = async (commune) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/meteo/actuelle/${commune}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erreur API météo');

      const data = await response.json();
      
      if (data.success) {
        setDonneesMeteo(data.data);
        success(`Météo actualisée pour ${commune}`);
      } else {
        throw new Error(data.error);
      }

    } catch (err) {
      error('Erreur chargement météo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCouleurAlerte = (niveau) => {
    switch (niveau) {
      case 'danger': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'secondary';
    }
  };

  if (loading && !donneesMeteo) {
    return (
      <Card className="flutter-card">
        <Card.Body className="text-center">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Chargement des données météo...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Sélecteur de commune */}
      <Card className="flutter-card mb-3">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-1">🌤️ Météo Communale</h4>
              <p className="text-muted mb-0">Données météo en temps réel</p>
            </Col>
            <Col xs="auto">
              <select
                className="form-select"
                value={communeSelectionnee}
                onChange={(e) => setCommuneSelectionnee(e.target.value)}
                disabled={loading}
              >
                {communes.map(commune => (
                  <option key={commune} value={commune}>{commune}</option>
                ))}
              </select>
            </Col>
            <Col xs="auto">
              <Button 
                variant="outline-primary" 
                onClick={() => chargerMeteo(communeSelectionnee)}
                disabled={loading}
              >
                🔄 Actualiser
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {donneesMeteo && (
        <>
          {/* Météo actuelle */}
          <Card className="flutter-card mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={2} className="text-center">
                  <div style={{ fontSize: '4rem' }}>
                    {donneesMeteo.actuelle.icone}
                  </div>
                </Col>
                <Col md={4}>
                  <h2>{donneesMeteo.actuelle.temperature}°C</h2>
                  <p className="mb-1">
                    <strong>{donneesMeteo.actuelle.condition}</strong>
                  </p>
                  <p className="text-muted mb-0">{donneesMeteo.commune}</p>
                </Col>
                <Col md={6}>
                  <Row>
                    <Col>
                      <div className="text-center">
                        <div>💧</div>
                        <div><strong>{donneesMeteo.actuelle.humidite}%</strong></div>
                        <small>Humidité</small>
                      </div>
                    </Col>
                    <Col>
                      <div className="text-center">
                        <div>🌧️</div>
                        <div><strong>{donneesMeteo.actuelle.pluie}mm</strong></div>
                        <small>Pluie</small>
                      </div>
                    </Col>
                    <Col>
                      <div className="text-center">
                        <div>💨</div>
                        <div><strong>{donneesMeteo.actuelle.vent} km/h</strong></div>
                        <small>Vent</small>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Alertes météo */}
          {donneesMeteo.alertes && donneesMeteo.alertes.length > 0 && (
            <Card className="flutter-card mb-3">
              <Card.Header>
                <h5 className="mb-0">🚨 Alertes Météo</h5>
              </Card.Header>
              <Card.Body>
                {donneesMeteo.alertes.map((alerte, index) => (
                  <Alert key={index} variant={getCouleurAlerte(alerte.niveau)}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6>{alerte.message}</h6>
                        <p className="mb-1">{alerte.impact}</p>
                        <div>
                          {alerte.actions.map((action, i) => (
                            <Badge key={i} bg="light" text="dark" className="me-1">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge bg={getCouleurAlerte(alerte.niveau)}>
                        {alerte.type.toUpperCase()}
                      </Badge>
                    </div>
                  </Alert>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Prévisions */}
          <Card className="flutter-card">
            <Card.Header>
              <h5 className="mb-0">📅 Prévisions sur 5 jours</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {donneesMeteo.previsions.map((jour, index) => (
                  <Col key={index} className="text-center">
                    <div className="p-2 border rounded">
                      <div style={{ fontSize: '2rem' }}>{jour.icone}</div>
                      <div className="fw-bold">{jour.temp_max}°</div>
                      <div className="text-muted">{jour.temp_min}°</div>
                      <small>{new Date(jour.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</small>
                      <br />
                      <small className="text-muted">{jour.precipitation}mm</small>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default MeteoPanel;