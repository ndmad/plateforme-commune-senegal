import React, { useState, useMemo } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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
  ArcElement,
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
  ArcElement
);

const GraphiquesInteractifs = ({ ressources, communes }) => {
  const [periode, setPeriode] = useState('mois');
  const [typeAnalyse, setTypeAnalyse] = useState('evolution');

  // Données pour graphique d'évolution temporelle
  const donneesEvolution = useMemo(() => {
    const maintenant = new Date();
    let groupes = {};

    ressources.forEach(ressource => {
      const date = new Date(ressource.created_at);
      let cle;

      switch (periode) {
        case 'semaine':
          cle = `S${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`;
          break;
        case 'mois':
          cle = `${date.getMonth() + 1}/${date.getFullYear()}`;
          break;
        case 'trimestre':
          const trimestre = Math.floor(date.getMonth() / 3) + 1;
          cle = `T${trimestre} ${date.getFullYear()}`;
          break;
        default:
          cle = date.getFullYear().toString();
      }

      if (!groupes[cle]) groupes[cle] = 0;
      groupes[cle]++;
    });

    const labels = Object.keys(groupes).sort();
    const data = labels.map(label => groupes[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Nouvelles ressources',
          data,
          borderColor: 'var(--primary-600)',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [ressources, periode]);

  // Données pour analyse comparative par commune
  const donneesCommunes = useMemo(() => {
    const ressourcesParCommune = ressources.reduce((acc, ressource) => {
      const commune = communes.find(c => c.id === ressource.commune_id);
      const nomCommune = commune ? commune.nom : 'Inconnue';
      
      if (!acc[nomCommune]) acc[nomCommune] = 0;
      acc[nomCommune]++;
      return acc;
    }, {});

    const entries = Object.entries(ressourcesParCommune)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      labels: entries.map(([nom]) => nom),
      datasets: [
        {
          label: 'Ressources par commune',
          data: entries.map(([,count]) => count),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2
        }
      ]
    };
  }, [ressources, communes]);

  const optionsEvolution = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre de ressources'
        }
      }
    }
  };

  return (
    <div className="flutter-card elevated" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>📈 Analytics Avancés</h3>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            className="flutter-input"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            style={{ width: 'auto', minWidth: '120px' }}
          >
            <option value="semaine">Par semaine</option>
            <option value="mois">Par mois</option>
            <option value="trimestre">Par trimestre</option>
            <option value="annee">Par année</option>
          </select>

          <select 
            className="flutter-input"
            value={typeAnalyse}
            onChange={(e) => setTypeAnalyse(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="evolution">Évolution</option>
            <option value="communes">Par commune</option>
            <option value="potentiel">Par potentiel</option>
          </select>
        </div>
      </div>

      {typeAnalyse === 'evolution' && (
        <div style={{ height: '400px' }}>
          <Line data={donneesEvolution} options={optionsEvolution} />
        </div>
      )}

      {typeAnalyse === 'communes' && (
        <div style={{ height: '400px' }}>
          <Bar data={donneesCommunes} options={optionsEvolution} />
        </div>
      )}

      {typeAnalyse === 'potentiel' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h4 style={{ marginBottom: '16px' }}>Répartition par type</h4>
            <Doughnut 
              data={donneesEvolution} 
              options={{ maintainAspectRatio: false }} 
              style={{ height: '200px' }}
            />
          </div>
          <div>
            <h4 style={{ marginBottom: '16px' }}>Top communes</h4>
            <Bar 
              data={donneesCommunes} 
              options={{ 
                ...optionsEvolution, 
                indexAxis: 'y',
                maintainAspectRatio: false 
              }} 
              style={{ height: '200px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphiquesInteractifs;