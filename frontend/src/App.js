import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import CarteCommunale from './components/CarteCommunale';
import ListeRessources from './components/ListeRessources';
import Header from './components/Header';
import FormulaireRessource from './components/FormulaireRessource';
import Login from './components/Login';
import RechercheFiltres from './components/RechercheFiltres';
import Dashboard from './components/Dashboard';
import useMobile from './hooks/useMobile';

function App() {
  const isMobile = useMobile();
  const [ressources, setRessources] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [showFormulaire, setShowFormulaire] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [ressourcesFiltrees, setRessourcesFiltrees] = useState([]);
  
  // États pour la navigation mobile
  const [activeView, setActiveView] = useState('carte');
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    chargerDonnees();
  }, []);

  // Filtrer les ressources quand la recherche ou les filtres changent
  useEffect(() => {
    filtrerRessources();
  }, [ressources, searchTerm, filters]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      const reponseCommunes = await fetch('http://localhost:5000/api/communes');
      const dataCommunes = await reponseCommunes.json();
      setCommunes(dataCommunes.data || []);

      const reponseRessources = await fetch('http://localhost:5000/api/ressources');
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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Navigation mobile
  const MobileNavigation = () => (
    <div className="mobile-nav-bottom">
      <div className="mobile-nav-tabs">
        <button 
          className={`mobile-nav-tab ${activeView === 'carte' ? 'active' : ''}`}
          onClick={() => setActiveView('carte')}
        >
          🗺️
          <span>Carte</span>
        </button>
        <button 
          className={`mobile-nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          📊
          <span>Stats</span>
        </button>
        <button 
          className="mobile-nav-tab mobile-nav-add"
          onClick={() => setShowFormulaire(true)}
        >
          ➕
          <span>Ajouter</span>
        </button>
        <button 
          className={`mobile-nav-tab ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍
          <span>Filtres</span>
          {Object.keys(filters).filter(key => filters[key]).length > 0 && (
            <Badge bg="danger" className="filter-badge">
              {Object.keys(filters).filter(key => filters[key]).length}
            </Badge>
          )}
        </button>
        <button 
          className={`mobile-nav-tab ${showList ? 'active' : ''}`}
          onClick={() => setShowList(!showList)}
        >
          📋
          <span>Liste</span>
          <Badge bg="primary" className="filter-badge">
            {ressourcesFiltrees.length}
          </Badge>
        </button>
      </div>
    </div>
  );

  // Render la vue active
// NOUVELLE version COMPLÈTE de renderActiveView
const renderActiveView = () => {
  if (activeView === 'dashboard') {
    return <Dashboard ressources={ressources} communes={communes} />;
  }

  // Vue Carte
  return (
    <div className="main-content-wrapper">
      {/* Filtres mobiles */}
      {isMobile && showFilters && (
        <div className="mobile-filters-panel">
          <div className="mobile-filters-header">
            <h6>🔍 Recherche et Filtres</h6>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              ✕
            </Button>
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
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowList(false)}
            >
              ✕
            </Button>
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

      {/* LAYOUT PRINCIPAL CORRIGÉ - SANS ESPACE BLANC */}
      <div className="main-layout-container">
        {/* Section carte - DOIT PRENDRE TOUT L'ESPACE DISPO */}
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
        
        {/* Sidebar desktop - FIXE À DROITE */}
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
     
<Header 
  onViewChange={setActiveView} 
  activeView={activeView}
  user={user}
  onLogout={handleLogout}
  isMobile={isMobile}
  onShowLogin={() => setShowLogin(true)}
  onShowFormulaire={() => setShowFormulaire(true)}
/>
      
    

<div className="main-container">
  {renderActiveView()}
</div>

      {/* Navigation mobile */}
      {isMobile && <MobileNavigation />}

      <FormulaireRessource 
        show={showFormulaire}
        onHide={() => setShowFormulaire(false)}
        onRessourceAdded={handleRessourceAdded}
        isMobile={isMobile}
      />

      <Login 
        show={showLogin}
        onHide={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
        isMobile={isMobile}
      />
    </div>
  );
}

export default App;