import React, { useState } from 'react';
import { Card, Badge, Row, Col, Button } from 'react-bootstrap';

import EditRessource from './EditRessource'; // ← CET IMPORT DOIT EXISTER

const ListeRessources = ({ ressources, selectedCommune, onRessourceUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRessource, setSelectedRessource] = useState(null);
  const [user, setUser] = useState(null);

  // Récupérer l'utilisateur connecté
  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const getCouleurPotentiel = (potentiel) => {
    switch(potentiel) {
      case 'élevé': return 'success';
      case 'moyen': return 'warning';
      case 'faible': return 'secondary';
      default: return 'light';
    }
  };

  const getIcône = (type) => {
    const icones = {
      'Agricole': '🌾',
      'Hydrique': '💧', 
      'Commerciale': '🏪',
      'Artisanale': '🛠️',
      'Touristique': '🏞️'
    };
    return icones[type] || '📍';
  };

  const handleEdit = (ressource) => {
    setSelectedRessource(ressource);
    setShowEditModal(true);
  };

  const handleDelete = async (ressource) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${ressource.nom}" ?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('❌ Vous devez être connecté pour supprimer une ressource');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/ressources/${ressource.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        alert('❌ Vous n\'êtes pas autorisé à supprimer cette ressource');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('✅ Ressource supprimée avec succès!');
        if (onRessourceUpdated) {
          onRessourceUpdated();
        }
      } else {
        alert('❌ Erreur: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  // Vérifier si l'utilisateur peut modifier/supprimer une ressource
 // Dans ListeRessources.js, ajoutez des logs de debug
const canModify = (ressource) => {
  if (!user) {
    console.log('❌ Pas d\'utilisateur connecté');
    return false;
  }
  
  console.log('👤 Utilisateur:', user);
  console.log('📝 Ressource created_by:', ressource.created_by);
  console.log('🔑 Comparaison:', user.id, '===', ressource.created_by);
  
  // Admin peut tout modifier
  if (user.role === 'admin') {
    console.log('✅ Admin - accès complet');
    return true;
  }
  
  // Éditeur peut modifier ses propres ressources
  if (user.role === 'editeur' && ressource.created_by === user.id) {
    console.log('✅ Éditeur - propriétaire de la ressource');
    return true;
  }
  
  console.log('❌ Aucune permission');
  return false;
};



  return (
    <div>
      <h4 className="mb-4">
        📋 Ressources du Territoire
        <Badge bg="primary" className="ms-2">
          {ressources ? ressources.length : 0}
        </Badge>
      </h4>

      {!ressources || ressources.length === 0 ? (
        <Card className="text-center p-4">
          <Card.Text>
            Aucune ressource trouvée. 
            <br />
            <small className="text-muted">
              Ajoutez des ressources via le bouton "➕ Ajouter".
            </small>
          </Card.Text>
        </Card>
      ) : (
        ressources.map((ressource) => (
          <Card key={ressource.id} className="mb-3 shadow-sm">
            <Card.Body>
              <Row>
                <Col xs={2}>
                  <span style={{ fontSize: '1.5em' }}>
                    {getIcône(ressource.type)}
                  </span>
                </Col>
                <Col xs={10}>
                  <Card.Title className="h6">{ressource.nom}</Card.Title>
                  <Card.Text className="text-muted small mb-1">
                    {ressource.description}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Badge bg="outline-primary" text="dark">
                      {ressource.type}
                    </Badge>
                    <Badge bg={getCouleurPotentiel(ressource.potentiel)}>
                      Potentiel: {ressource.potentiel}
                    </Badge>
                  </div>
                  
                  {/* Boutons d'action */}
                  {canModify(ressource) && (
                    <div className="d-flex gap-2 mt-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEdit(ressource)}
                      >
                        ✏️ Modifier
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(ressource)}
                      >
                        🗑️ Supprimer
                      </Button>
                    </div>
                  )}
                  
                  <small className="text-muted d-block mt-1">
                    ID: {ressource.id} • 
                    Créée le: {new Date(ressource.created_at).toLocaleDateString()}
                  </small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))
      )}

      {/* Modal d'édition */}
      {selectedRessource && (
        <EditRessource 
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setSelectedRessource(null);
          }}
          ressource={selectedRessource}
          onRessourceUpdated={onRessourceUpdated}
        />
      )}
    </div>
  );
};

export default ListeRessources;