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

function App() {
  const [ressources, setRessources] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [showFormulaire, setShowFormulaire] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement - UNE SEULE FOIS
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    chargerDonnees();
  }, []); // ← ✅ TABLEAU VIDE = exécuté une seule fois

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

  const handleRessourceAdded = () => {
    chargerDonnees();
  };

  // Ajoutez cette fonction pour les mises à jour
const handleRessourceUpdated = () => {
  chargerDonnees(); // Recharger les données après modification/suppression
};

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
            <CarteCommunale 
              ressources={ressources}
              communes={communes}
              onCommuneSelect={setSelectedCommune}
            />
          </Col>
          
          <Col lg={4} className="p-3 bg-light" style={{height: '100vh', overflowY: 'auto'}}>
            <ListeRessources 
              ressources={ressources}
              selectedCommune={selectedCommune}
              onRessourceUpdated={handleRessourceUpdated}  // ← NOUVEAU
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