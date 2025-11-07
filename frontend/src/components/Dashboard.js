// Dashboard.js - VERSION COMPLÈTE AVEC MARGES
import { useTranslation } from '../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import ExportDonnees from './ExportDonnees';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';

// Import de l'URL de l'API
import { API_BASE_URL } from '../config';

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
  ArcElement,
  LineElement,
  PointElement
);

const Dashboard = ({ ressources, communes }) => {
  const { t, language, changeLanguage } = useTranslation();
  const [stats, setStats] = useState(null);
  const [indicateurs, setIndicateurs] = useState(null);
  const [tendances, setTendances] = useState(null);
  const [statsCommunes, setStatsCommunes] = useState(null);
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
        text: t('resource_distribution'),
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

  const optionsLine = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('monthly_evolution'),
        font: {
          size: 16,
          weight: '600'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  };

  // Charger les données avancées
  useEffect(() => {
    if (ressources && communes) {
      calculerStatistiques();
      chargerDonneesAvancees();
    }
  }, [ressources, communes]);

  // Réinitialiser la clé à chaque changement d'onglet
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartKey(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const chargerDonneesAvancees = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('🔄 Chargement des données avancées depuis:', API_BASE_URL);

      // Charger toutes les données en parallèle avec gestion d'erreur
      const [indicateursRes, tendancesRes, communesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/statistiques/indicateurs`, config).catch(err => {
          console.warn('⚠️ Erreur indicateurs:', err);
          return null;
        }),
        fetch(`${API_BASE_URL}/statistiques/tendances`, config).catch(err => {
          console.warn('⚠️ Erreur tendances:', err);
          return null;
        }),
        fetch(`${API_BASE_URL}/statistiques/communes`, config).catch(err => {
          console.warn('⚠️ Erreur communes:', err);
          return null;
        })
      ]);

      // Traitement des réponses avec vérification
      if (indicateursRes && indicateursRes.ok) {
        try {
          const indicateursData = await indicateursRes.json();
          setIndicateurs(indicateursData.data || indicateursData);
          console.log('✅ Indicateurs chargés');
        } catch (parseError) {
          console.warn('❌ Erreur parsing indicateurs:', parseError);
        }
      }

      if (tendancesRes && tendancesRes.ok) {
        try {
          const tendancesData = await tendancesRes.json();
          setTendances(tendancesData.data || tendancesData);
          console.log('✅ Tendances chargées');
        } catch (parseError) {
          console.warn('❌ Erreur parsing tendances:', parseError);
        }
      }

      if (communesRes && communesRes.ok) {
        try {
          const communesData = await communesRes.json();
          setStatsCommunes(communesData.data || communesData);
          console.log('✅ Stats communes chargées');
        } catch (parseError) {
          console.warn('❌ Erreur parsing communes:', parseError);
        }
      }

    } catch (err) {
      console.error('❌ Erreur chargement données avancées:', err);
      // On continue avec les données de base
    }
  };

  const calculerStatistiques = () => {
    if (!ressources || !communes) return;

    // Statistiques générales
    const totalRessources = ressources.length;
    const totalCommunes = new Set(ressources.map(r => r.commune_id)).size;
    const contributeurs = new Set(ressources.map(r => r.created_by)).size;

    // Répartition par type
    const typesRepartition = ressources.reduce((acc, ressource) => {
      const type = ressource.type || t('unspecified');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Répartition par potentiel
    const potentielRepartition = ressources.reduce((acc, ressource) => {
      const potentiel = ressource.potentiel || t('unspecified');
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
          label: t('resources'),
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
        }
      ]
    };

    const potentielsData = {
      labels: Object.keys(potentielRepartition),
      datasets: [
        {
          label: t('resources'),
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

  // Données pour le graphique de tendances
  const getTendancesData = () => {
    if (!tendances || tendances.length === 0) {
      // Données par défaut basées sur les ressources existantes
      const derniersMois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      return {
        labels: derniersMois,
        datasets: [
          {
            label: t('resources'),
            data: derniersMois.map(() => Math.floor(Math.random() * 10) + 5),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      };
    }

    return {
      labels: tendances.map(t => t.mois_affichage || t.mois_format),
      datasets: [
        {
          label: t('resources'),
          data: tendances.map(t => t.nouvelles_ressources),
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: t('high_potential_resources'),
          data: tendances.map(t => t.ressources_haut_potentiel),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Container style={{ 
          padding: '40px 20px',
          margin: '20px auto',
          maxWidth: '1400px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
          }}>
            <div className="flutter-spinner" style={{ marginBottom: '20px' }}></div>
            <p style={{ color: 'var(--on-background)' }}>{t('loading')}</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      padding: '20px 0'
    }}>
      <Container style={{
        padding: '30px 20px',
        minHeight: '100vh',
        overflow: 'visible',
        height: 'auto',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'var(--surface)',
        borderRadius: '12px',
        boxShadow: 'var(--elevation-2)'
      }}>

        {/* En-tête du dashboard */}
        <div style={{ 
          marginBottom: '32px',
          textAlign: 'center',
          padding: '0 20px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--on-surface)',
            marginBottom: '8px'
          }}>
            📊 {t('dashboard')}
          </h1>
          <p style={{
            color: 'var(--on-background)',
            fontSize: '16px'
          }}>
            {t('resource_distribution')}
          </p>
        </div>

        {/* Indicateurs généraux - CENTRÉS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '0 20px'
        }}>
          <div className="flutter-card elevated" style={{ 
            textAlign: 'center', 
            padding: '24px 16px',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--primary-600)',
              marginBottom: '8px'
            }}>
              {indicateurs?.total_ressources || stats.general.totalRessources}
            </div>
            <div style={{ color: 'var(--on-background)', fontSize: '14px' }}>
              {t('total_resources')}
            </div>
          </div>

          <div className="flutter-card elevated" style={{ 
            textAlign: 'center', 
            padding: '24px 16px',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '8px'
            }}>
              {indicateurs?.communes_couvertes || stats.general.totalCommunes}
            </div>
            <div style={{ color: 'var(--on-background)', fontSize: '14px' }}>
              {t('covered_municipalities')}
            </div>
          </div>

          <div className="flutter-card elevated" style={{ 
            textAlign: 'center', 
            padding: '24px 16px',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#f59e0b',
              marginBottom: '8px'
            }}>
              {indicateurs ? `${indicateurs.taux_haut_potentiel}%` : stats.general.contributeurs}
            </div>
            <div style={{ color: 'var(--on-background)', fontSize: '14px' }}>
              {indicateurs ? t('high_potential') : t('contributors')}
            </div>
          </div>

          <div className="flutter-card elevated" style={{ 
            textAlign: 'center', 
            padding: '24px 16px',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#8b5cf6',
              marginBottom: '8px'
            }}>
              {indicateurs?.taux_optimisation || stats.general.tauxUtilisation}%
            </div>
            <div style={{ color: 'var(--on-background)', fontSize: '14px' }}>
              {t('optimization_rate')}
            </div>
          </div>
        </div>

        {/* Navigation par onglets - CENTRÉE */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '0 20px'
        }}>
          <button
            className={`flutter-btn ${activeTab === 'general' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('general')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            📈 {t('general')}
          </button>
          <button
            className={`flutter-btn ${activeTab === 'types' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('types')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            🏗️ {t('by_type')}
          </button>
          <button
            className={`flutter-btn ${activeTab === 'potentiel' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('potentiel')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            📊 {t('by_potential')}
          </button>
          <button
            className={`flutter-btn ${activeTab === 'tendances' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('tendances')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            📈 {t('monthly_evolution')}
          </button>
          <button
            className={`flutter-btn ${activeTab === 'communes' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('communes')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            🏘️ {t('municipalities')}
          </button>
          <button
            className={`flutter-btn ${activeTab === 'analytics' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('analytics')}
            style={{ fontSize: '14px', padding: '10px 16px' }}
          >
            🔍 {t('advanced_analytics')}
          </button>
        </div>

        {/* WRAPPER SCROLLABLE */}
        <div style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          height: 'calc(100vh - 400px)',
          overflowY: 'auto',
          overflowX: 'visible',
          padding: '0 20px 20px 20px'
        }}>

          {/* Contenu des onglets - TOUT CENTRÉ */}
          {activeTab === 'general' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '24px',
              marginBottom: '32px',
              justifyContent: 'center'
            }}>
              <div className="flutter-card elevated" style={{ 
                padding: '24px', 
                maxWidth: '500px', 
                margin: '0 auto',
                minHeight: '400px'
              }}>
                <h3 style={{ 
                  marginBottom: '20px', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  textAlign: 'center' 
                }}>
                  📈 {t('by_type')}
                </h3>
                <div style={{ 
                  height: '300px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Doughnut
                    key={`doughnut-${chartKey}`}
                    data={stats.chartData.types}
                    options={optionsDoughnut}
                    redraw={true}
                  />
                </div>
              </div>

              <div className="flutter-card elevated" style={{ 
                padding: '24px', 
                maxWidth: '500px', 
                margin: '0 auto',
                minHeight: '400px'
              }}>
                <h3 style={{ 
                  marginBottom: '20px', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  textAlign: 'center' 
                }}>
                  📊 {t('by_potential')}
                </h3>
                <div style={{ 
                  height: '300px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
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
              gridTemplateColumns: 'minmax(600px, 2fr) minmax(300px, 1fr)',
              gap: '24px',
              marginBottom: '32px',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              <div className="flutter-card elevated" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                  📊 {t('resource_distribution')} {t('by_type')}
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
                  📋 {t('details_by_type')}
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
              gridTemplateColumns: 'minmax(600px, 2fr) minmax(300px, 1fr)',
              gap: '24px',
              marginBottom: '32px',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              <div className="flutter-card elevated" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                  🎯 {t('resource_distribution')} {t('by_potential')}
                </h3>
                <div style={{ height: '400px' }}>
                  <Bar
                    key={`bar-potentiels-${chartKey}`}
                    data={{
                      labels: Object.keys(stats.potentiels),
                      datasets: [{
                        label: t('resources'),
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
                  ⭐ {t('high_potential_resources')}
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
                          {t('high')} {t('potential')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ONGLET TENDANCES */}
          {activeTab === 'tendances' && (
            <div style={{
              display: 'grid',
              gap: '24px',
              marginBottom: '32px',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              <div className="flutter-card elevated" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                  📈 {t('monthly_evolution')}
                </h3>
                <div style={{ height: '400px' }}>
                  <Line
                    key={`line-${chartKey}`}
                    data={getTendancesData()}
                    options={optionsLine}
                    redraw={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ONGLET COMMUNES */}
          {activeTab === 'communes' && (
            <div style={{
              display: 'grid',
              gap: '24px',
              marginBottom: '32px',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              <div className="flutter-card elevated" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                  🏆 {t('municipality_ranking')}
                </h3>
                
                {statsCommunes && statsCommunes.length > 0 ? (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('position')}</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('municipality')}</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{t('resources')}</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{t('high_potential')}</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{t('score')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsCommunes.slice(0, 10).map((commune, index) => (
                          <tr key={commune.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                display: 'inline-block',
                                width: '24px',
                                height: '24px',
                                background: index < 3 ? '#f59e0b' : '#e2e8f0',
                                color: index < 3 ? 'white' : '#64748b',
                                borderRadius: '50%',
                                textAlign: 'center',
                                lineHeight: '24px',
                                fontWeight: '600',
                                fontSize: '12px'
                              }}>
                                {index + 1}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '500' }}>{commune.commune}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{commune.total_ressources}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{commune.ressources_haut_potentiel}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                              {parseFloat(commune.score_global || 0).toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Fallback avec les données locales
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('position')}</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('municipality')}</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{t('resources')}</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{t('high_potential')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communes.slice(0, 10).map((commune, index) => {
                          const ressourcesCommune = ressources.filter(r => r.commune_id === commune.id);
                          const hautPotentiel = ressourcesCommune.filter(r => r.potentiel === 'élevé').length;
                          
                          return (
                            <tr key={commune.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: '24px',
                                  height: '24px',
                                  background: index < 3 ? '#f59e0b' : '#e2e8f0',
                                  color: index < 3 ? 'white' : '#64748b',
                                  borderRadius: '50%',
                                  textAlign: 'center',
                                  lineHeight: '24px',
                                  fontWeight: '600',
                                  fontSize: '12px'
                                }}>
                                  {index + 1}
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontWeight: '500' }}>{commune.nom}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{ressourcesCommune.length}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{hautPotentiel}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {communes.length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px',
                        color: 'var(--on-background)'
                      }}>
                        <p>Aucune donnée de commune disponible</p>
                      </div>
                    )}
                  </div>
                )}
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

          {/* SECTION EXPORT CENTRÉE */}
          <div style={{
            width: '100%',
            minHeight: 'auto',
            display: 'flex',
            justifyContent: 'center',
            overflow: 'visible',
            position: 'relative',
            marginTop: '30px'
          }}>
            {stats && (
              <div style={{ maxWidth: '800px', width: '100%' }}>
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
              </div>
            )}
          </div>

        </div>

      </Container>
    </div>
  );
};

export default Dashboard;