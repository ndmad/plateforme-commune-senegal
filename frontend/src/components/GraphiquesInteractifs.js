import React, { useState, useEffect } from 'react';
import { Bar, Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const GraphiquesInteractifs = ({ ressources, communes }) => {
  const [donneesAvancees, setDonneesAvancees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeGraphique, setTypeGraphique] = useState('comparaison');

  useEffect(() => {
    chargerDonneesAvancees();
  }, []);

  const chargerDonneesAvancees = async () => {
    try {
      // Ici vous appellerez vos nouvelles API
      // Pour l'instant, on simule avec les données existantes
      setTimeout(() => {
        setDonneesAvancees(genererDonneesSimulees());
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur chargement données avancées:', error);
      setLoading(false);
    }
  };

  const genererDonneesSimulees = () => {
    // Simulation de données avancées
    return {
      comparaisonCommunes: {
        labels: communes.map(c => c.nom),
        datasets: [
          {
            label: 'Ressources Haut Potentiel',
            data: communes.map(() => Math.floor(Math.random() * 20) + 5),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 2
          },
          {
            label: 'Ressources Optimisées',
            data: communes.map(() => Math.floor(Math.random() * 15) + 3),
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 2
          }
        ]
      },
      tendances: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [
          {
            label: 'Nouvelles Ressources',
            data: [12, 19, 8, 15, 22, 18, 25, 20, 17, 23, 28, 30],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Ressources Haut Potentiel',
            data: [5, 8, 6, 10, 12, 9, 15, 13, 11, 14, 16, 18],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      }
    };
  };

  if (loading) {
    return (
      <div className="flutter-card elevated" style={{ padding: '24px', textAlign: 'center' }}>
        <div className="flutter-spinner" style={{ margin: '0 auto 16px' }}></div>
        <p>Chargement des analyses avancées...</p>
      </div>
    );
  }

  const optionsComparaison = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Comparaison des Communes',
        font: { size: 16, weight: '600' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre de Ressources'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Communes'
        }
      }
    }
  };

  const optionsTendances = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution Mensuelle',
        font: { size: 16, weight: '600' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre de Ressources'
        }
      }
    }
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Sélecteur de type de graphique */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          className={`flutter-btn ${typeGraphique === 'comparaison' ? 'primary' : 'secondary'}`}
          onClick={() => setTypeGraphique('comparaison')}
        >
          🏘️ Comparaison Communes
        </button>
        <button
          className={`flutter-btn ${typeGraphique === 'tendances' ? 'primary' : 'secondary'}`}
          onClick={() => setTypeGraphique('tendances')}
        >
          📈 Tendances Temporelles
        </button>
        <button
          className={`flutter-btn ${typeGraphique === 'repartition' ? 'primary' : 'secondary'}`}
          onClick={() => setTypeGraphique('repartition')}
        >
          🎯 Répartition Avancée
        </button>
      </div>

      {/* Graphiques */}
      <div style={{
        display: 'grid',
        gap: '24px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))'
      }}>
        {typeGraphique === 'comparaison' && (
          <div className="flutter-card elevated" style={{ padding: '24px' }}>
            <Bar 
              data={donneesAvancees.comparaisonCommunes} 
              options={optionsComparaison}
              height={300}
            />
          </div>
        )}

        {typeGraphique === 'tendances' && (
          <div className="flutter-card elevated" style={{ padding: '24px' }}>
            <Line 
              data={donneesAvancees.tendances} 
              options={optionsTendances}
              height={300}
            />
          </div>
        )}

        {typeGraphique === 'repartition' && (
          <div className="flutter-card elevated" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '20px' }}>📊 Analyse Détaillée</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {ressources.filter(r => r.potentiel === 'élevé').length}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--on-background)' }}>
                  Ressources Haut Potentiel
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {ressources.filter(r => r.etat_utilisation === 'optimisé').length}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--on-background)' }}>
                  Ressources Optimisées
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  {new Set(ressources.map(r => r.commune_id)).size}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--on-background)' }}>
                  Communes Actives
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphiquesInteractifs;