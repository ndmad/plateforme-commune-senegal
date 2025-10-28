import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import ExportDonnees from './ExportDonnees';
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

// Import des nouveaux composants
import GraphiquesInteractifs from './GraphiquesInteractifs';
import CarteThermique from './CarteThermique';

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
  const [chartKey, setChartKey] = useState(0);

  // Options avec animations FORCÉES
  const optionsBar = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Répartition des ressources',
        font: {
          size: 16,
          weight: '600'
        },
        padding: 20,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      }
    },
    // ANIMATIONS FORCÉES
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
      animateRotate: true,
      animateScale: true
    },
    transitions: {
      show: {
        animations: {
          x: {
            from: 0
          },
          y: {
            from: 0
          }
        }
      },
      hide: {
        animations: {
          x: {
            to: 0
          },
          y: {
            to: 0
          }
        }
      }
    }
  };

  const optionsPie = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      }
    },
    // ANIMATIONS FORCÉES POUR PIE
    animation: {
      duration: 1500,
      easing: 'easeOutBounce',
      animateRotate: true,
      animateScale: true
    },
    transitions: {
      active: {
        animation: {
          duration: 1500
        }
      }
    }
  };

  const optionsDoughnut = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      }
    },
    cutout: '60%',
    // ANIMATIONS FORCÉES POUR DOUGHNUT
    animation: {
      duration: 1800,
      easing: 'easeOutCirc',
      animateRotate: true,
      animateScale: true
    },
    transitions: {
      active: {
        animation: {
          duration: 1800
        }
      }
    }
  };

  // Calculer les statistiques
  useEffect(() => {
    if (ressources && communes) {
      calculerStatistiques();
    }
  }, [ressources, communes]);

  // Réinitialiser la clé à chaque changement d'onglet
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartKey(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

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

    // Top 5 des ressources par potentiel élevé
    const topRessources = ressources
      .filter(r => r.potentiel === 'élevé')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    // Préparer les données pour les graphiques
    const typesData = {
      labels: Object.keys(typesRepartition),
      datasets: [
        {
          label: 'Nombre de ressources',
          data: Object.values(typesRepartition),
          backgroundColor: [
            '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#64748b'
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          borderRadius: 8,
          hoverBorderWidth: 3,
          hoverBorderColor: '#ffffff',
          // Animation properties for bars
          animation: {
            duration: 1200
          }
        }
      ]
    };

    const potentielsData = {
      labels: Object.keys(potentielRepartition),
      datasets: [
        {
          label: 'Nombre de ressources',
          data: Object.values(potentielRepartition),
          backgroundColor: [
            '#10b981',  // Élevé - Vert
            '#f59e0b',  // Moyen - Jaune
            '#64748b',   // Faible - Gris
            '#ef4444'   // Autre - Rouge
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverBorderColor: '#ffffff',
          // Animation properties for pie/doughnut
          animation: {
            animateRotate: true,
            animateScale: true
          }
        }
      ]
    };

    setStats({
      general: {
        totalRessources,
        totalCommunes,
        contributeurs,
        tauxUtilisation: Math.round((ressources.filter(r => r.etat_utilisation === 'optimisé').length / totalRessources) * 100) || 0
      },
      types: typesRepartition,
      potentiels: potentielRepartition,
      topRessources,
      chartData: {
        types: typesData,
        potentiels: potentielsData
      }
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <Container style={{ padding: '40px 20px' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div className="flutter-spinner" style={{ marginBottom: '20px' }}></div>
          <p style={{ color: 'var(--on-background)' }}>Calcul des statistiques...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container style={{
      padding: '24px 16px',
      minHeight: '100vh',
      overflow: 'visible',
      height: 'auto'
    }}>

      {/* En-tête du dashboard */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--on-surface)',
          marginBottom: '8px'
        }}>
          📊 Tableau de Bord
        </h1>
        <p style={{
          color: 'var(--on-background)',
          fontSize: '16px'
        }}>
          Analyse et statistiques des ressources territoriales
        </p>
      </div>

      {/* Indicateurs généraux */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="flutter-card elevated" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--primary-600)',
            marginBottom: '8px'
          }}>
            {stats.general.totalRessources}
          </div>
          <div style={{ color: 'var(--on-background)', fontSize: '14px' }}>
            Ressources totales
          </div>
        </div>

        <div className="flutter-card elevated" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#10b981',
            marginBottom: '8px'
          }}>
            {stats.general.totalCommunes}
          </div>
          <div style={{ color: 'var(--on-background)', fontSize: '14px' }}>
            Communes couvertes
          </div>
        </div>

        <div className="flutter-card elevated" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f59e0b',
            marginBottom: '8px'
          }}>
            {stats.general.contributeurs}
          </div>
          <div style={{ color: 'var(--on-background)', fontSize: '14px' }}>
            Contributeurs
          </div>
        </div>

        <div className="flutter-card elevated" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#8b5cf6',
            marginBottom: '8px'
          }}>
            {stats.general.tauxUtilisation}%
          </div>
          <div style={{ color: 'var(--on-background)', fontSize: '14px' }}>
            Taux d'optimisation
          </div>
        </div>
      </div>

      {/* WRAPPER SCROLLABLE */}
      <div style={{
        width: '100%',
        height: 'calc(100vh - 300px)',
        overflowY: 'auto',
        overflowX: 'visible',
        paddingRight: '8px'
      }}>

        {/* Navigation par onglets */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            className={`flutter-btn ${activeTab === 'general' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('general')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            📈 Vue Générale
          </button>
          <button
            className={`flutter-btn ${activeTab === 'types' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('types')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            🏗️ Par Type
          </button>
          <button
            className={`flutter-btn ${activeTab === 'potentiel' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('potentiel')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            📊 Par Potentiel
          </button>

          <button
            className={`flutter-btn ${activeTab === 'analytics' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('analytics')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            🔍 Analytics Avancés
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'general' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div className="flutter-card elevated" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                📈 Répartition par Type
              </h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut
                  key={`doughnut-${chartKey}`}
                  data={stats.chartData.types}
                  options={optionsDoughnut}
                  redraw={true}
                />
              </div>
            </div>

            <div className="flutter-card elevated" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                📊 Répartition par Potentiel
              </h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pie
                  key={`pie-${chartKey}`}
                  data={stats.chartData.potentiels}
                  options={optionsPie}
                  redraw={true}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'types' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div className="flutter-card elevated" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                📊 Répartition par Type de Ressource
              </h3>
              <div style={{ height: '400px' }}>
                <Bar
                  key={`bar-types-${chartKey}`}
                  data={stats.chartData.types}
                  options={optionsBar}
                  redraw={true}
                />
              </div>
            </div>

            <div className="flutter-card elevated" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                📋 Détail par Type
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(stats.types).map(([type, count]) => (
                  <div key={type} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{type}</span>
                    <span className="flutter-chip">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'potentiel' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div className="flutter-card elevated" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                🎯 Répartition par Potentiel de Valorisation
              </h3>
              <div style={{ height: '400px' }}>
                <Bar
                  key={`bar-potentiels-${chartKey}`}
                  data={{
                    labels: Object.keys(stats.potentiels),
                    datasets: [{
                      label: 'Nombre de ressources',
                      data: Object.values(stats.potentiels),
                      backgroundColor: [
                        '#10b981',  // Élevé - Vert
                        '#f59e0b',  // Moyen - Jaune
                        '#64748b',   // Faible - Gris
                        '#ef4444'   // Autre - Rouge
                      ],
                      borderWidth: 2,
                      borderColor: '#ffffff',
                      borderRadius: 8,
                      hoverBorderWidth: 3,
                      hoverBorderColor: '#ffffff',
                    }]
                  }}
                  options={optionsBar}
                  redraw={true}
                />
              </div>
            </div>

            <div className="flutter-card elevated" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                ⭐ Top 5 Ressources à Haut Potentiel
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.topRessources.map((ressource, index) => (
                  <div key={ressource.id} style={{
                    padding: '16px',
                    background: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--elevation-3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--elevation-1)';
                    }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        background: 'var(--primary-500)',
                        color: 'white',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        flex: 1
                      }}>
                        {ressource.nom}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span className="flutter-chip" style={{ fontSize: '11px' }}>
                        {ressource.type}
                      </span>
                      <span className="flutter-chip" style={{
                        fontSize: '11px',
                        background: '#dcfce7',
                        color: '#166534'
                      }}>
                        Potentiel Élevé
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET ANALYTICS AVANCÉS */}
        {activeTab === 'analytics' && (
          <div style={{
            marginBottom: '32px',
            overflow: 'visible'
          }}>
            <GraphiquesInteractifs
              ressources={ressources}
              communes={communes}
            />

            <CarteThermique
              ressources={ressources}
              communes={communes}
            />
          </div>
        )}

        {/* SECTION EXPORT */}
        <div style={{
          width: '100%',
          minHeight: 'auto',
          display: 'block',
          overflow: 'visible',
          position: 'relative'
        }}>
          {stats && (
            <ExportDonnees
              ressources={ressources}
              stats={stats}
              type="dashboard"
              onExportStart={(format) => {
                console.log(`🚀 Début export ${format}...`);
              }}
              onExportComplete={(success, format, error) => {
                if (success) {
                  alert(`✅ Export ${format} réussi !`);
                } else {
                  alert(`❌ Erreur export ${format}: ${error}`);
                }
              }}
              isMobile={false}
            />
          )}
        </div>

      </div>

    </Container>
  );
};

export default Dashboard;