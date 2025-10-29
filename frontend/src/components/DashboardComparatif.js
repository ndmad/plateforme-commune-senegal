import React, { useState, useMemo } from 'react';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
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
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardComparatif = ({ communes, ressources }) => {
  const [selectedCommunes, setSelectedCommunes] = useState([]);
  const [indicateurActif, setIndicateurActif] = useState('ressources');

  // Générer des données simulées enrichies pour la démo
  const donneesSimulees = useMemo(() => {
    return communes.map(commune => {
      const ressourcesCommune = ressources.filter(r => r.commune_id === commune.id);
      const typesRepartition = ressourcesCommune.reduce((acc, res) => {
        acc[res.type] = (acc[res.type] || 0) + 1;
        return acc;
      }, {});

      // Données simulées pour les indicateurs
      return {
        ...commune,
        indicateurs: {
          totalRessources: ressourcesCommune.length,
          tauxOptimisation: Math.floor((ressourcesCommune.filter(r => 
            r.etat_utilisation === 'optimisé'
          ).length / ressourcesCommune.length) * 100) || 0,
          
          diversiteTypes: Object.keys(typesRepartition).length,
          
          potentielMoyen: ressourcesCommune.reduce((acc, res) => {
            const poids = { 'élevé': 3, 'moyen': 2, 'faible': 1 };
            return acc + (poids[res.potentiel] || 0);
          }, 0) / ressourcesCommune.length || 0,
          
          // Indicateurs simulés pour enrichir la comparaison
          population: Math.floor(Math.random() * 500000) + 50000,
          superficie: Math.floor(Math.random() * 500) + 50,
          densite: 0,
          budgetAlloue: Math.floor(Math.random() * 10000000) + 1000000,
          projetsEnCours: Math.floor(Math.random() * 15) + 5
        }
      };
    });
  }, [communes, ressources]);

  // Calculer la densité de population
  const donneesAvecDensite = useMemo(() => {
    return donneesSimulees.map(commune => ({
      ...commune,
      indicateurs: {
        ...commune.indicateurs,
        densite: commune.indicateurs.population / commune.indicateurs.superficie
      }
    }));
  }, [donneesSimulees]);

  // Données pour les graphiques
  const getChartData = () => {
    const communesSelectionnees = donneesAvecDensite.filter(c => 
      selectedCommunes.some(sc => sc.id === c.id)
    );

    switch (indicateurActif) {
      case 'ressources':
        return {
          labels: communesSelectionnees.map(c => c.nom),
          datasets: [
            {
              label: 'Nombre de ressources',
              data: communesSelectionnees.map(c => c.indicateurs.totalRessources),
              backgroundColor: '#00853f',
              borderColor: '#006b33',
              borderWidth: 2,
              borderRadius: 8,
            }
          ]
        };

      case 'optimisation':
        return {
          labels: communesSelectionnees.map(c => c.nom),
          datasets: [
            {
              label: 'Taux d\'optimisation (%)',
              data: communesSelectionnees.map(c => c.indicateurs.tauxOptimisation),
              backgroundColor: '#0ea5e9',
              borderColor: '#0284c7',
              borderWidth: 2,
              borderRadius: 8,
            }
          ]
        };

      case 'potentiel':
        return {
          labels: communesSelectionnees.map(c => c.nom),
          datasets: [
            {
              label: 'Potentiel moyen',
              data: communesSelectionnees.map(c => c.indicateurs.potentielMoyen),
              backgroundColor: '#f59e0b',
              borderColor: '#d97706',
              borderWidth: 2,
              borderRadius: 8,
            }
          ]
        };

      case 'diversite':
        return {
          labels: communesSelectionnees.map(c => c.nom),
          datasets: [
            {
              label: 'Diversité des types',
              data: communesSelectionnees.map(c => c.indicateurs.diversiteTypes),
              backgroundColor: '#8b5cf6',
              borderColor: '#7c3aed',
              borderWidth: 2,
              borderRadius: 8,
            }
          ]
        };

      default:
        return { labels: [], datasets: [] };
    }
  };

  // Données pour le radar chart
  const getRadarData = () => {
    const communesSelectionnees = donneesAvecDensite.filter(c => 
      selectedCommunes.some(sc => sc.id === c.id)
    );

    if (communesSelectionnees.length === 0) return { labels: [], datasets: [] };

    return {
      labels: ['Ressources', 'Optimisation', 'Potentiel', 'Diversité', 'Projets'],
      datasets: communesSelectionnees.map((commune, index) => ({
        label: commune.nom,
        data: [
          commune.indicateurs.totalRessources / 10, // Normalisation
          commune.indicateurs.tauxOptimisation,
          commune.indicateurs.potentielMoyen * 33.3, // Normalisation 1-3 -> 0-100
          commune.indicateurs.diversiteTypes * 20, // Normalisation 1-5 -> 0-100
          commune.indicateurs.projetsEnCours
        ],
        backgroundColor: [
          'rgba(0, 133, 63, 0.2)',
          'rgba(14, 165, 233, 0.2)',
          'rgba(245, 158, 11, 0.2)'
        ][index % 3],
        borderColor: [
          '#00853f',
          '#0ea5e9',
          '#f59e0b'
        ][index % 3],
        borderWidth: 2,
        pointBackgroundColor: [
          '#00853f',
          '#0ea5e9',
          '#f59e0b'
        ][index % 3],
      }))
    };
  };

  // Options des graphiques
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Comparaison des ${getChartTitle()}`,
        font: {
          size: 16,
          weight: '600'
        }
      },
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
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Profil comparé des communes',
        font: {
          size: 16,
          weight: '600'
        }
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  const getChartTitle = () => {
    const titles = {
      ressources: 'Ressources par commune',
      optimisation: 'Taux d\'optimisation',
      potentiel: 'Potentiel moyen des ressources',
      diversite: 'Diversité des types de ressources'
    };
    return titles[indicateurActif] || 'Comparaison';
  };

  return (
    <div className="dashboard-comparatif">
      {/* En-tête */}
      <div className="comparatif-header">
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700',
          color: 'var(--on-surface)',
          marginBottom: '8px'
        }}>
          🏆 Tableau de Bord Comparatif
        </h2>
        <p style={{ 
          color: 'var(--on-background)',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          Comparez les performances et indicateurs entre les communes
        </p>
      </div>

      {/* Sélecteur de communes */}
      <div className="flutter-card elevated" style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
          📋 Sélection des communes à comparer
        </h4>
        <div className="commune-selector">
          <div className="commune-checkboxes" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {communes.slice(0, 8).map(commune => (
              <label key={commune.id} style={{ 
                display: 'flex', 
                alignItems: 'center',
                padding: '12px',
                background: 'var(--background)',
                borderRadius: 'var(--radius-md)',
                border: selectedCommunes.some(c => c.id === commune.id) ? 
                  '2px solid #00853f' : '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <input
                  type="checkbox"
                  checked={selectedCommunes.some(c => c.id === commune.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (selectedCommunes.length < 3) {
                        setSelectedCommunes(prev => [...prev, commune]);
                      }
                    } else {
                      setSelectedCommunes(prev => prev.filter(c => c.id !== commune.id));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{commune.nom}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{commune.region}</div>
                </div>
              </label>
            ))}
          </div>
          
          {selectedCommunes.length > 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px',
              background: '#f0fdf4',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #bbf7d0'
            }}>
              <strong style={{ color: '#166534' }}>
                {selectedCommunes.length} commune(s) sélectionnée(s)
              </strong>
              <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                Maximum 3 communes pour une comparaison optimale
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCommunes.length > 0 ? (
        <>
          {/* Sélecteur d'indicateurs */}
          <div className="flutter-card elevated" style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
              📊 Choisir l'indicateur à comparer
            </h4>
            <div className="indicateur-selector" style={{ 
              display: 'flex', 
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {[
                { key: 'ressources', label: '📦 Nombre de ressources', emoji: '📦' },
                { key: 'optimisation', label: '⚡ Taux d\'optimisation', emoji: '⚡' },
                { key: 'potentiel', label: '🎯 Potentiel moyen', emoji: '🎯' },
                { key: 'diversite', label: '🌈 Diversité des types', emoji: '🌈' }
              ].map(indicateur => (
                <button
                  key={indicateur.key}
                  onClick={() => setIndicateurActif(indicateur.key)}
                  className={`flutter-btn ${indicateurActif === indicateur.key ? 'primary' : 'secondary'}`}
                  style={{ fontSize: '14px', padding: '10px 16px' }}
                >
                  {indicateur.emoji} {indicateur.label}
                </button>
              ))}
            </div>
          </div>

          {/* Graphiques de comparaison */}
          <div className="comparison-charts" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Graphique en barres */}
            <div className="flutter-card elevated">
              <div style={{ height: '300px' }}>
                <Bar data={getChartData()} options={barOptions} />
              </div>
            </div>

            {/* Graphique radar */}
            <div className="flutter-card elevated">
              <div style={{ height: '300px' }}>
                <Radar data={getRadarData()} options={radarOptions} />
              </div>
            </div>
          </div>

          {/* Tableau comparatif détaillé */}
          <div className="flutter-card elevated">
            <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
              📋 Tableau Comparatif Détaillé
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--primary-50)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                      Indicateur
                    </th>
                    {selectedCommunes.map(commune => (
                      <th key={commune.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>
                        {commune.nom}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'totalRessources', label: 'Ressources totales', format: (v) => v },
                    { key: 'tauxOptimisation', label: 'Taux d\'optimisation (%)', format: (v) => `${v}%` },
                    { key: 'potentielMoyen', label: 'Potentiel moyen', format: (v) => v.toFixed(2) },
                    { key: 'diversiteTypes', label: 'Diversité des types', format: (v) => v },
                    { key: 'projetsEnCours', label: 'Projets en cours', format: (v) => v }
                  ].map(row => (
                    <tr key={row.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{row.label}</td>
                      {selectedCommunes.map(commune => {
                        const data = donneesAvecDensite.find(c => c.id === commune.id);
                        return (
                          <td key={commune.id} style={{ padding: '12px', textAlign: 'center' }}>
                            {data ? row.format(data.indicateurs[row.key]) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* État vide */
        <div className="flutter-card elevated" style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'var(--background)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--on-surface)' }}>
            Commencez la comparaison
          </h3>
          <p style={{ color: 'var(--on-background)', marginBottom: '24px' }}>
            Sélectionnez jusqu'à 3 communes dans la liste ci-dessus pour comparer leurs performances
          </p>
          <div style={{ 
            display: 'inline-flex',
            gap: '8px',
            background: '#f0fdf4',
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #bbf7d0'
          }}>
            <span>💡</span>
            <span style={{ color: '#166534', fontSize: '14px' }}>
              <strong>Astuce :</strong> Comparez des communes de régions différentes pour des insights intéressants
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardComparatif;