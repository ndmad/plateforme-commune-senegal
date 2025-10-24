import React from 'react';
import { Card, Badge, Row, Col } from 'react-bootstrap';

const ListeRessources = ({ ressources, selectedCommune }) => {
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
      'Minérale': '⛏️',
      'Touristique': '🏞️'
    };
    return icones[type] || '📍';
  };

  console.log('Ressources dans ListeRessources:', ressources); // DEBUG

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
              Ajoutez des ressources via le bouton "➕ Ajouter une Ressource".
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
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg="outline-primary" text="dark">
                      {ressource.type}
                    </Badge>
                    <Badge bg={getCouleurPotentiel(ressource.potentiel)}>
                      Potentiel: {ressource.potentiel}
                    </Badge>
                  </div>
                  <small className="text-muted">ID: {ressource.id}</small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );
};

export default ListeRessources;