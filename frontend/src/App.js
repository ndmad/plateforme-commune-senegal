import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import CarteCommunale from './components/CarteCommunale';
import ListeRessources from './components/ListeRessources';
import Header from './components/Header';
import FormulaireRessource from './components/FormulaireRessource'; // ← NOUVEAU

function App() {
  const [ressources, setRessources] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [showFormulaire, setShowFormulaire] = useState(false); // ← NOUVEAU

  // Charger les données au démarrage
  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      const reponseCommunes = await fetch('http://localhost:5000/api/communes');
      const dataCommunes = await reponseCommunes.json();
      setCommunes(dataCommunes.data || []);

      const reponseRessources = await fetch('http://localhost:5000/api/ressources');
      const dataRessources = await reponseRessources.json();
      setRessources(dataRessources.data || []);
    } catch (erreur) {
      console.log('API non disponible, utilisation des données de test');
    }
  };

  // ← NOUVEAU : Fonction pour rafraîchir après ajout
  const handleRessourceAdded = () => {
    chargerDonnees(); // Recharger les données
  };

  return (
    <div className="App">
      <Header />
      
      {/* ← NOUVEAU : Bouton d'ajout en haut à droite */}
      <div className="position-absolute top-0 end-0 m-3" style={{zIndex: 1000}}>
        <Button 
          variant="success" 
          size="lg"
          onClick={() => setShowFormulaire(true)}
        >
          ➕ Ajouter une Ressource
        </Button>
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
            />
          </Col>
        </Row>
      </Container>

      {/* ← NOUVEAU : Modal du formulaire */}
      <FormulaireRessource 
        show={showFormulaire}
        onHide={() => setShowFormulaire(false)}
        onRessourceAdded={handleRessourceAdded}
      />
    </div>
  );
}

export default App;