import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import CarteCommunale from './components/CarteCommunale';
import ListeRessources from './components/ListeRessources';
import Header from './components/Header';
import FormulaireRessource from './components/FormulaireRessource';
import Login from './components/Login';
import RechercheFiltres from './components/RechercheFiltres'; // ← NOUVEAU

function App() {
  const [ressources, setRessources] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [showFormulaire, setShowFormulaire] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // NOUVEAU : États pour la recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [ressourcesFiltrees, setRessourcesFiltrees] = useState([]);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    chargerDonnees();
  }, []);

  // NOUVEAU : Filtrer les ressources quand la recherche ou les filtres changent
  useEffect(() => {
    filtrerRessources();
  }, [ressources, searchTerm, filters]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des données...');
      
      const reponseCommunes = await fetch('http://localhost:5000/api/communes');
      const dataCommunes = await reponseCommunes.json();
      console.log('🏘️ Communes:', dataCommunes);
      setCommunes(dataCommunes.data || []);

      const reponseRessources = await fetch('http://localhost:5000/api/ressources');
      const dataRessources = await reponseRessources.json();
      console.log('📦 Ressources:', dataRessources);
      setRessources(dataRessources.data || []);
      
    } catch (erreur) {
      console.error('❌ Erreur chargement données:', erreur);
    } finally {
      setLoading(false);
    }
  };

  // NOUVEAU : Fonction de filtrage
  const filtrerRessources = () => {
    let filtered = ressources;

    // Filtre par recherche textuelle
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ressource =>
        ressource.nom.toLowerCase().includes(term) ||
        (ressource.description && ressource.description.toLowerCase().includes(term))
      );
    }

    // Filtre par type
    if (filters.type) {
      filtered = filtered.filter(ressource => ressource.type === filters.type);
    }

    // Filtre par potentiel
    if (filters.potentiel) {
      filtered = filtered.filter(ressource => ressource.potentiel === filters.potentiel);
    }

    // Filtre par commune
    if (filters.commune) {
      filtered = filtered.filter(ressource => ressource.commune_id === parseInt(filters.commune));
    }

    // Filtre par état d'utilisation
    if (filters.etat_utilisation) {
      filtered = filtered.filter(ressource => ressource.etat_utilisation === filters.etat_utilisation);
    }

    setRessourcesFiltrees(filtered);
    console.log(`🔍 ${filtered.length} ressources après filtrage`);
  };

  const handleRessourceAdded = () => {
    console.log('🔄 Rechargement après ajout...');
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

  // NOUVEAU : Gestionnaires de recherche et filtres
  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="App">
      <Header />
      
      {/* Barre d'état de connexion */}
      <div className="position-absolute top-0 end-0 m-3" style={{zIndex: 1000}}>
        <div className="d-flex gap-2 align-items-center">
          {user ? (
            <>
              <span className="text-white bg-success px-2 py-1 rounded">
                👋 {user.nom} ({user.role})
              </span>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleLogout}
              >
                🚪 Déconnexion
              </Button>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => setShowFormulaire(true)}
              >
                ➕ Ajouter
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={() => setShowLogin(true)}
              >
                🔐 Connexion
              </Button>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => setShowLogin(true)}
              >
                ➕ Ajouter
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Container fluid>
        <Row>
          <Col lg={8} className="p-0">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-2">Chargement de la carte...</p>
                </div>
              </div>
            ) : (
              <CarteCommunale 
                ressources={ressourcesFiltrees} // ← Utiliser les ressources filtrées
                communes={communes}
                onCommuneSelect={setSelectedCommune}
              />
            )}
          </Col>
          
          <Col lg={4} className="p-3 bg-light" style={{height: '100vh', overflowY: 'auto'}}>
            {/* NOUVEAU : Composant de recherche */}
            <RechercheFiltres 
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              communes={communes}
            />
            
            <ListeRessources 
              ressources={ressourcesFiltrees} // ← Utiliser les ressources filtrées
              selectedCommune={selectedCommune}
              onRessourceUpdated={handleRessourceAdded}
            />
          </Col>
        </Row>
      </Container>

      <FormulaireRessource 
        show={showFormulaire}
        onHide={() => setShowFormulaire(false)}
        onRessourceAdded={handleRessourceAdded}
      />

      <Login 
        show={showLogin}
        onHide={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;