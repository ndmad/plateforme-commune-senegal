import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Tab, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNotifications } from '../Notifications';
// Ajouter l'import en haut
import CarteANSDPanel from '../cartographie/CarteANSDPanel';

import { API_BASE_URL } from '../../config';

// ✅ FONCTION FORMATNUMBER DÉFINIE ICI
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

const ANSDPanel = () => {
  const [activeTab, setActiveTab] = useState('demographie');
  const [communeData, setCommuneData] = useState(null);
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState('Dakar');
  const { success, error } = useNotifications();

  const communes = ['Dakar', 'Pikine', 'Guediawaye', 'Rufisque'];

  useEffect(() => {
    loadCommuneData(selectedCommune);
    loadGlobalData();
  }, [selectedCommune]);

  const loadCommuneData = async (commune) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [demographic, economic, indicateurs] = await Promise.all([
        fetch(`${API_BASE_URL}/ansd/demographie/${commune}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/ansd/economie/${commune}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/ansd/indicateurs/${commune}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
      ]);

      setCommuneData({
        demographic: demographic.data,
        economic: economic.data,
        indicateurs: indicateurs.data
      });

    } catch (err) {
      error('Erreur chargement données ANSD');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ansd/statistiques-globales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGlobalData(data.data);
      }
    } catch (err) {
      console.error('Erreur données globales:', err);
    }
  };

  if (loading && !communeData) {
    return (
      <Card className="flutter-card">
        <Card.Body className="text-center">
          <Spinner animation="border" role="status" className="text-primary" />
          <p className="mt-2">Chargement des données ANSD...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* En-tête avec sélecteur de commune */}
      <Card className="flutter-card mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-1">🌍 Données ANSD - Sénégal</h4>
              <p className="text-muted mb-0">
                Statistiques démographiques et économiques des communes
              </p>
            </Col>
            <Col xs="auto">
              <select
                className="form-select"
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
              >
                {communes.map(commune => (
                  <option key={commune} value={commune}>{commune}</option>
                ))}
              </select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Navigation par onglets */}
      <Card className="flutter-card">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Tab eventKey="demographie" title="📊 Démographie">
              <DemographicTab data={communeData} />
            </Tab>

            <Tab eventKey="economie" title="💼 Économie">
              <EconomicTab data={communeData} />
            </Tab>

            <Tab eventKey="indicateurs" title="📈 Indicateurs">
              <IndicatorsTab data={communeData} />
            </Tab>
            {/* ✅ NOUVEL ONGLET CARTOGRAPHIE */}
            <Tab eventKey="cartographie" title="🗺️ Cartographie">
              <CarteANSDPanel />
            </Tab>

            <Tab eventKey="comparaison" title="🔄 Comparaison">
              <ComparisonTab data={globalData} selectedCommune={selectedCommune} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

// Composant pour l'onglet Démographie
const DemographicTab = ({ data }) => {
  if (!data?.demographic) return <Alert variant="info">Chargement...</Alert>;

  const { population, menages, pyramide_ages } = data.demographic;

  return (
    <Row>
      <Col md={4}>
        <Card className="flutter-card text-center h-100">
          <Card.Body>
            <h2>👥</h2>
            <h3>{formatNumber(population.total)}</h3>
            <p className="text-muted mb-1">Population totale</p>
            <Badge bg="success">+{population.growth}% croissance</Badge>
          </Card.Body>
        </Card>
      </Col>

      <Col md={4}>
        <Card className="flutter-card text-center h-100">
          <Card.Body>
            <h2>🏠</h2>
            <h3>{formatNumber(menages.total_menages)}</h3>
            <p className="text-muted mb-1">Ménages</p>
            <small>Taille moyenne: {menages.taille_moyenne} pers.</small>
          </Card.Body>
        </Card>
      </Col>

      <Col md={4}>
        <Card className="flutter-card text-center h-100">
          <Card.Body>
            <h2>📏</h2>
            <h3>{formatNumber(population.density)}</h3>
            <p className="text-muted mb-1">Habitants/km²</p>
            <small>Densité de population</small>
          </Card.Body>
        </Card>
      </Col>

      {/* Pyramide des âges */}
      <Col md={12} className="mt-4">
        <Card className="flutter-card">
          <Card.Header>
            <h5 className="mb-0">📊 Pyramide des Âges</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(pyramide_ages).map(([tranche, pourcentage]) => (
                <Col key={tranche} md={3} className="text-center">
                  <div className="p-3 border rounded">
                    <h4 className="text-primary">{pourcentage}%</h4>
                    <p className="mb-0 text-muted">{tranche} ans</p>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

// Composant pour l'onglet Économie
const EconomicTab = ({ data }) => {
  if (!data?.economic) return <Alert variant="info">Chargement...</Alert>;

  const economic = data.economic;

  return (
    <Row>
      <Col md={6}>
        <Card className="flutter-card h-100">
          <Card.Header>
            <h5 className="mb-0">💼 Indicateurs Économiques</h5>
          </Card.Header>
          <Card.Body>
            <div className="d-grid gap-3">
              <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                <span>Taux de chômage</span>
                <Badge bg={economic.taux_chomage > 15 ? 'danger' : 'warning'}>
                  {economic.taux_chomage}%
                </Badge>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                <span>Revenu mensuel moyen</span>
                <Badge bg="success">
                  {formatNumber(economic.revenu_moyen)} FCFA
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card className="flutter-card h-100">
          <Card.Header>
            <h5 className="mb-0">🏭 Répartition Sectorielle</h5>
          </Card.Header>
          <Card.Body>
            <div className="d-grid gap-2">
              <div className="d-flex justify-content-between align-items-center">
                <span>Primaire</span>
                <div className="d-flex align-items-center gap-2">
                  <div className="progress" style={{ width: '100px', height: '8px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${economic.secteur_primaire}%` }}
                    ></div>
                  </div>
                  <span>{economic.secteur_primaire}%</span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <span>Secondaire</span>
                <div className="d-flex align-items-center gap-2">
                  <div className="progress" style={{ width: '100px', height: '8px' }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{ width: `${economic.secteur_secondaire}%` }}
                    ></div>
                  </div>
                  <span>{economic.secteur_secondaire}%</span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <span>Tertiaire</span>
                <div className="d-flex align-items-center gap-2">
                  <div className="progress" style={{ width: '100px', height: '8px' }}>
                    <div
                      className="progress-bar bg-info"
                      style={{ width: `${economic.secteur_tertiaire}%` }}
                    ></div>
                  </div>
                  <span>{economic.secteur_tertiaire}%</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

// Composant pour l'onglet Indicateurs
const IndicatorsTab = ({ data }) => {
  if (!data?.indicateurs) return <Alert variant="info">Chargement...</Alert>;

  const indicateurs = data.indicateurs;

  const getIDHLevel = (idh) => {
    if (idh >= 0.7) return { label: 'Élevé', variant: 'success' };
    if (idh >= 0.55) return { label: 'Moyen', variant: 'warning' };
    return { label: 'Faible', variant: 'danger' };
  };

  const idhLevel = getIDHLevel(indicateurs.idh);

  return (
    <Row>
      <Col md={3}>
        <Card className="flutter-card text-center">
          <Card.Body>
            <h2>📊</h2>
            <h3>{indicateurs.idh}</h3>
            <p className="text-muted mb-1">IDH</p>
            <Badge bg={idhLevel.variant}>{idhLevel.label}</Badge>
          </Card.Body>
        </Card>
      </Col>

      <Col md={3}>
        <Card className="flutter-card text-center">
          <Card.Body>
            <h2>🎓</h2>
            <h3>{indicateurs.scolarisation}%</h3>
            <p className="text-muted mb-0">Taux de scolarisation</p>
          </Card.Body>
        </Card>
      </Col>

      <Col md={3}>
        <Card className="flutter-card text-center">
          <Card.Body>
            <h2>💧</h2>
            <h3>{indicateurs.acces_eau}%</h3>
            <p className="text-muted mb-0">Accès à l'eau</p>
          </Card.Body>
        </Card>
      </Col>

      <Col md={3}>
        <Card className="flutter-card text-center">
          <Card.Body>
            <h2>⚡</h2>
            <h3>{indicateurs.acces_electricite}%</h3>
            <p className="text-muted mb-0">Accès électricité</p>
          </Card.Body>
        </Card>
      </Col>

      <Col md={12} className="mt-4">
        <Card className="flutter-card">
          <Card.Header>
            <h5 className="mb-0">📈 Indicateurs de Développement</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <div className="d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                  <span>Pauvreté</span>
                  <Badge bg="danger">{indicateurs.pauvreté}%</Badge>
                </div>
              </Col>
              <Col md={6}>
                <div className="d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                  <span>Croissance démographique</span>
                  <Badge bg="info">
                    +{data.demographic?.population?.growth || 0}%
                  </Badge>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

// Composant pour l'onglet Comparaison
const ComparisonTab = ({ data, selectedCommune }) => {
  if (!data) return <Alert variant="info">Chargement des données de comparaison...</Alert>;

  return (
    <div>
      <h5 className="mb-3">Comparaison des Communes</h5>
      <Row>
        {Object.entries(data).map(([commune, stats]) => (
          <Col key={commune} md={6} className="mb-3">
            <Card className={`flutter-card ${commune === selectedCommune ? 'border-primary' : ''}`}>
              <Card.Header>
                <h6 className="mb-0">
                  {commune}
                  {commune === selectedCommune && <Badge bg="primary" className="ms-2">Actuelle</Badge>}
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <div className="d-flex justify-content-between">
                    <small>Population:</small>
                    <small><strong>{formatNumber(stats.demographic.population.total)}</strong></small>
                  </div>
                  <div className="d-flex justify-content-between">
                    <small>Chômage:</small>
                    <small><strong>{stats.economic.taux_chomage}%</strong></small>
                  </div>
                  <div className="d-flex justify-content-between">
                    <small>IDH:</small>
                    <small><strong>{stats.indicateurs.idh}</strong></small>
                  </div>
                  <div className="d-flex justify-content-between">
                    <small>Densité:</small>
                    <small><strong>{formatNumber(stats.demographic.population.density)}</strong></small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ANSDPanel;