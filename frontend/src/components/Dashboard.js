import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Badge } from 'react-bootstrap';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = ({ ressources, communes }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Calculer les statistiques
  useEffect(() => {
    if (ressources && communes) {
      calculerStatistiques();
    }
  }, [ressources, communes]);

  const calculerStatistiques = () => {
    if (!ressources || !communes) return;

    // Statistiques générales
    const totalRessources = ressources.length;
    const totalCommunes = new Set(ressources.map(r => r.commune_id)).size;
    const contributeurs = new Set(ressources.map(r => r.created_by)).size;

    // Répartition par type
    const typesRepartition = ressources.reduce((acc, ressource) => {
      const type = ressource.type || 'Non spécifié';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Répartition par potentiel
    const potentielRepartition = ressources.reduce((acc, ressource) => {
      const potentiel = ressource.potentiel || 'Non spécifié';
      acc[potentiel] = (acc[potentiel] || 0) + 1;
      return acc;
    }, {});

    // Répartition par commune
    const communeRepartition = ressources.reduce((acc, ressource) => {
      const commune = communes.find(c => c.id === ressource.commune_id);
      const nomCommune = commune ? commune.nom : 'Commune inconnue';
      acc[nomCommune] = (acc[nomCommune] || 0) + 1;
      return acc;
    }, {});

    // Top 5 des ressources par potentiel élevé
    const topRessources = ressources
      .filter(r => r.potentiel === 'élevé')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    setStats({
      general: {
        totalRessources,
        totalCommunes,
        contributeurs,
        tauxUtilisation: Math.round((ressources.filter(r => r.etat_utilisation === 'optimisé').length / totalRessources) * 100) || 0
      },
      types: typesRepartition,
      potentiels: potentielRepartition,
      communes: communeRepartition,
      topRessources
    });
    
    setLoading(false);
  };

  // Fonction d'export PDF simplifiée
  const exportPDF = () => {
    alert('📄 Fonction PDF à implémenter');
  };

  // Fonction d'export Excel simplifiée
  const exportExcel = () => {
    alert('📊 Fonction Excel à implémenter');
  };

  // Fonction de rapport complet simplifiée
  const genererRapportComplet = () => {
    alert('📋 Fonction Rapport à implémenter');
  };

  // Données pour le graphique des types
  const dataTypes = {
    labels: stats ? Object.keys(stats.types) : [],
    datasets: [
      {
        label: 'Nombre de ressources',
        data: stats ? Object.values(stats.types) : [],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // Données pour le graphique des potentiels
  const dataPotentiels = {
    labels: stats ? Object.keys(stats.potentiels) : [],
    datasets: [
      {
        label: 'Répartition par potentiel',
        data: stats ? Object.values(stats.potentiels) : [],
        backgroundColor: [
          '#FF6384',  // Faible - Rouge
          '#FFCE56',  // Moyen - Jaune
          '#4BC0C0'   // Élevé - Vert
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const optionsBar = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Répartition des ressources',
      },
    },
  };

  const optionsPie = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <Container className="my-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Calcul des statistiques...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      {/* Contenu principal pour l'export PDF */}
      <div id="dashboard-content">
        {/* En-tête du dashboard */}
        <Row className="mb-4">
          <Col>
            <h2>📊 Tableau de Bord des Ressources</h2>
            <p className="text-muted">
              Analyse et statistiques des ressources territoriales
            </p>
          </Col>
        </Row>

        {/* Indicateurs généraux */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-primary">
              <Card.Body>
                <h1 className="text-primary">{stats.general.totalRessources}</h1>
                <Card.Text>Ressources totales</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-success">
              <Card.Body>
                <h1 className="text-success">{stats.general.totalCommunes}</h1>
                <Card.Text>Communes couvertes</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-warning">
              <Card.Body>
                <h1 className="text-warning">{stats.general.contributeurs}</h1>
                <Card.Text>Contributeurs</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-info">
              <Card.Body>
                <h1 className="text-info">{stats.general.tauxUtilisation}%</h1>
                <Card.Text>Taux d'optimisation</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Navigation par onglets */}
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'general'} 
              onClick={() => setActiveTab('general')}
            >
              📈 Vue Générale
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'types'} 
              onClick={() => setActiveTab('types')}
            >
              🏗️ Par Type
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'potentiel'} 
              onClick={() => setActiveTab('potentiel')}
            >
              📊 Par Potentiel
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Contenu des onglets */}
        {activeTab === 'general' && (
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📈 Répartition par Type</h5>
                </Card.Header>
                <Card.Body>
                  <Doughnut data={dataTypes} options={optionsPie} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📊 Répartition par Potentiel</h5>
                </Card.Header>
                <Card.Body>
                  <Pie data={dataPotentiels} options={optionsPie} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {activeTab === 'types' && (
          <Row>
            <Col md={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📊 Répartition par Type de Ressource</h5>
                </Card.Header>
                <Card.Body>
                  <Bar data={dataTypes} options={optionsBar} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">📋 Détail par Type</h5>
                </Card.Header>
                <Card.Body>
                  {Object.entries(stats.types).map(([type, count]) => (
                    <div key={type} className="d-flex justify-content-between mb-2">
                      <span>{type}</span>
                      <Badge bg="primary">{count}</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {activeTab === 'potentiel' && (
          <Row>
            <Col md={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">🎯 Répartition par Potentiel de Valorisation</h5>
                </Card.Header>
                <Card.Body>
                  <Bar data={dataPotentiels} options={optionsBar} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">⭐ Top 5 Ressources à Haut Potentiel</h5>
                </Card.Header>
                <Card.Body>
                  {stats.topRessources.map((ressource, index) => (
                    <div key={ressource.id} className="mb-3 p-2 border rounded">
                      <h6 className="mb-1">
                        {index + 1}. {ressource.nom}
                      </h6>
                      <small className="text-muted">
                        {ressource.type} • Commune {ressource.commune_id}
                      </small>
                      <br />
                      <Badge bg="success">Potentiel Élevé</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Section export */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📤 Export des Données</h5>
            </Card.Header>
            <Card.Body>
              <p>Exportez les données statistiques pour vos rapports :</p>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={exportPDF}
              >
                📄 Export PDF
              </Button>
              <Button 
                variant="outline-success" 
                className="me-2"
                onClick={exportExcel}
              >
                📊 Export Excel
              </Button>
              <Button 
                variant="outline-info"
                onClick={genererRapportComplet}
              >
                📋 Rapport Complet
              </Button>
              
              <div className="mt-3">
                <small className="text-muted">
                  <strong>PDF:</strong> Capture du tableau de bord • 
                  <strong> Excel:</strong> Données brutes • 
                  <strong> Rapport:</strong> Analyse détaillée
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;