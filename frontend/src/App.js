import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import CarteCommunale from './components/CarteCommunale';
import ListeRessources from './components/ListeRessources';
import Header from './components/Header';
import FormulaireRessource from './components/FormulaireRessource';
import LoginPage from './components/LoginPage';
import RechercheFiltres from './components/RechercheFiltres';
import Dashboard from './components/Dashboard';
import useMobile from './hooks/useMobile';
import { API_BASE_URL } from './config'; // ← IMPORT AJOUTÉ

// MobileNavigation CORRIGÉ avec navigation exclusive
// Dans App.js - MobileNavigation CORRIGÉ
const MobileNavigation = ({ 
  activeView, 
  setActiveView, 
  showFilters, 
  setShowFilters, 
  showList, 
  setShowList, 
  filters, 
  ressourcesFiltrees,
  onLogout,
  user
}) => {
  
  // Gestion robuste de la navigation
  const handleCartePress = () => {
    setActiveView('carte');
    setShowFilters(false);
    setShowList(false);
  };

  const handleDashboardPress = () => {
    setActiveView('dashboard');
    setShowFilters(false);
    setShowList(false);
  };

  const handleFiltersPress = () => {
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);
    // Si on active les filtres, on désactive la liste et on reste sur la vue carte
    if (newShowFilters) {
      setShowList(false);
      setActiveView('carte'); // ← IMPORTANT: On reste sur carte quand on ouvre les filtres
    }
  };

  const handleListPress = () => {
    const newShowList = !showList;
    setShowList(newShowList);
    // Si on active la liste, on désactive les filtres et on reste sur la vue carte
    if (newShowList) {
      setShowFilters(false);
      setActiveView('carte'); // ← IMPORTANT: On reste sur carte quand on ouvre la liste
    }
  };

  return (
    <div className="mobile-nav-bottom">
      <div className="mobile-nav-tabs">
        <button 
          className={`mobile-nav-tab ${activeView === 'carte' ? 'active' : ''}`}
          onClick={handleCartePress}
        >
          🗺️
          <span>Carte</span>
        </button>
        
        <button 
          className={`mobile-nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={handleDashboardPress}
        >
          📊
          <span>Stats</span>
        </button>
        
        <button 
          className={`mobile-nav-tab ${showFilters ? 'active' : ''}`}
          onClick={handleFiltersPress}
        >
          🔍
          <span>Filtres</span>
          {Object.keys(filters).filter(key => filters[key]).length > 0 && (
            <span className="filter-badge">
              {Object.keys(filters).filter(key => filters[key]).length}
            </span>
          )}
        </button>
        
        <button 
          className={`mobile-nav-tab ${showList ? 'active' : ''}`}
          onClick={handleListPress}
        >
          📋
          <span>Liste</span>
          <span className="filter-badge">
            {ressourcesFiltrees.length}
          </span>
        </button>
        
        <button 
          className="mobile-nav-tab mobile-nav-logout"
          onClick={onLogout}
          title="Déconnexion"
        >
          🚪
          <span>Déco</span>
        </button>
      </div>
    </div>
  );
};

function App() {
  const isMobile = useMobile();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États de l'application (seulement si connecté)
  const [ressources, setRessources] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [showFormulaire, setShowFormulaire] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [ressourcesFiltrees, setRessourcesFiltrees] = useState([]);
  const [activeView, setActiveView] = useState('carte');
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);

  // Vérifier la connexion au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      chargerDonnees();
    } else {
      setLoading(false);
    }
  }, []);

  // Filtrer les ressources quand la recherche ou les filtres changent
  useEffect(() => {
    if (user) {
      filtrerRessources();
    }
  }, [ressources, searchTerm, filters, user]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      // ✅ CORRIGÉ : Utilise API_BASE_URL au lieu de localhost
      const reponseCommunes = await fetch(`${API_BASE_URL}/communes`);
      const dataCommunes = await reponseCommunes.json();
      setCommunes(dataCommunes.data || []);

      const reponseRessources = await fetch(`${API_BASE_URL}/ressources`);
      const dataRessources = await reponseRessources.json();
      setRessources(dataRessources.data || []);
      
    } catch (erreur) {
      console.error('❌ Erreur chargement données:', erreur);
    } finally {
      setLoading(false);
    }
  };

  const filtrerRessources = () => {
    let filtered = ressources;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ressource =>
        ressource.nom.toLowerCase().includes(term) ||
        (ressource.description && ressource.description.toLowerCase().includes(term))
      );
    }

    if (filters.type) {
      filtered = filtered.filter(ressource => ressource.type === filters.type);
    }

    if (filters.potentiel) {
      filtered = filtered.filter(ressource => ressource.potentiel === filters.potentiel);
    }

    if (filters.commune) {
      filtered = filtered.filter(ressource => ressource.commune_id === parseInt(filters.commune));
    }

    if (filters.etat_utilisation) {
      filtered = filtered.filter(ressource => ressource.etat_utilisation === filters.etat_utilisation);
    }

    setRessourcesFiltrees(filtered);
  };

  const handleRessourceAdded = () => {
    chargerDonnees();
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    chargerDonnees();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRessources([]);
    setCommunes([]);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Si pas connecté, afficher la page de connexion
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Si chargement en cours
  if (loading) {
    return (
      <div className="loading-fullscreen">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement de la plateforme...</p>
        </div>
      </div>
    );
  }

  // Render la vue active (seulement si connecté)
// Render la vue active (seulement si connecté)
const renderActiveView = () => {
  console.log('🔄 Vue active:', activeView); // Debug
  
  // Si on est sur le dashboard, on retourne seulement le dashboard
  if (activeView === 'dashboard') {
    return <Dashboard ressources={ressources} communes={communes} />;
  }

  // Sinon, on retourne la vue carte avec ses panneaux
  return (
    <div className="main-content-wrapper">
      {/* Filtres mobiles */}
      {isMobile && showFilters && (
        <div className="mobile-filters-panel">
          <div className="mobile-filters-header">
            <h6>🔍 Recherche et Filtres</h6>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowFilters(false)}
            >
              ✕
            </button>
          </div>
          <RechercheFiltres 
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            communes={communes}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Liste mobile */}
      {isMobile && showList && (
        <div className="mobile-list-panel">
          <div className="mobile-list-header">
            <h6>📋 Ressources ({ressourcesFiltrees.length})</h6>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowList(false)}
            >
              ✕
            </button>
          </div>
          <div className="mobile-list-content">
            <ListeRessources 
              ressources={ressourcesFiltrees}
              selectedCommune={selectedCommune}
              onRessourceUpdated={handleRessourceAdded}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* Layout principal */}
      <div className="main-layout-container">
        <div className={`carte-section ${!isMobile ? 'with-sidebar' : 'full-width'}`}>
          {loading ? (
            <div className="loading-container">
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2">Chargement de la carte...</p>
              </div>
            </div>
          ) : (
            <CarteCommunale 
              ressources={ressourcesFiltrees}
              communes={communes}
              onCommuneSelect={setSelectedCommune}
              isMobile={isMobile}
            />
          )}
        </div>
        
        {/* Sidebar desktop */}
        {!isMobile && (
          <div className="sidebar-section">
            <div className="sidebar-inner">
              <RechercheFiltres 
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
                communes={communes}
                isMobile={isMobile}
              />
              
              <ListeRessources 
                ressources={ressourcesFiltrees}
                selectedCommune={selectedCommune}
                onRessourceUpdated={handleRessourceAdded}
                isMobile={isMobile}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <div className="App">
      {/* Header - caché en mobile */}
      {!isMobile && (
        <Header 
          onViewChange={setActiveView} 
          activeView={activeView}
          user={user}
          onLogout={handleLogout}
          isMobile={isMobile}
          onShowFormulaire={() => setShowFormulaire(true)}
        />
      )}
      
      {/* Contenu principal */}
      <div className="main-container">
        {renderActiveView()}
      </div>
  
      {/* Navigation mobile */}
      {isMobile && (
        <MobileNavigation 
          activeView={activeView}
          setActiveView={setActiveView}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          showList={showList}
          setShowList={setShowList}
          filters={filters}
          ressourcesFiltrees={ressourcesFiltrees}
          onLogout={handleLogout}
          user={user}
        />
      )}
  
      {/* ✅ BOUTON AJOUTER FLOTTANT MOBILE - CORRIGÉ */}
      {isMobile && user && user.role !== 'consultant' && (
        <div className="mobile-add-floating-btn">
          <button className="floating-add-btn" onClick={() => setShowFormulaire(true)}>
            ➕
          </button>
        </div>
      )}
  
      <FormulaireRessource 
        show={showFormulaire}
        onHide={() => setShowFormulaire(false)}
        onRessourceAdded={handleRessourceAdded}
        isMobile={isMobile}
      />
    </div>
  );
}

export default App;