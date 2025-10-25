import React, { useState } from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';

const RechercheFiltres = ({ 
  onSearchChange, 
  onFilterChange, 
  communes,
  typesRessources 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    potentiel: '',
    commune: '',
    etat_utilisation: ''
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value
    };
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    const emptyFilters = {
      type: '',
      potentiel: '',
      commune: '',
      etat_utilisation: ''
    };
    setFilters(emptyFilters);
    setSearchTerm('');
    
    if (onFilterChange) {
      onFilterChange(emptyFilters);
    }
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const hasActiveFilters = searchTerm || 
    filters.type || 
    filters.potentiel || 
    filters.commune || 
    filters.etat_utilisation;

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-light">
        <h6 className="mb-0">🔍 Recherche et Filtres</h6>
      </Card.Header>
      <Card.Body>
        {/* Barre de recherche */}
        <Form.Group className="mb-3">
          <Form.Label>
            <strong>🔎 Recherche globale</strong>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Rechercher par nom, description..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Form.Text className="text-muted">
            Recherche dans le nom et la description des ressources
          </Form.Text>
        </Form.Group>

        {/* Filtres */}
        <Row>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>📊 Type de ressource</Form.Label>
              <Form.Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">Tous les types</option>
                <option value="Agricole">🌾 Agricole</option>
                <option value="Hydrique">💧 Hydrique</option>
                <option value="Commerciale">🏪 Commerciale</option>
                <option value="Artisanale">🛠️ Artisanale</option>
                <option value="Touristique">🏞️ Touristique</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>📈 Potentiel</Form.Label>
              <Form.Select
                value={filters.potentiel}
                onChange={(e) => handleFilterChange('potentiel', e.target.value)}
              >
                <option value="">Tous les potentiels</option>
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="élevé">Élevé</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>🏘️ Commune</Form.Label>
              <Form.Select
                value={filters.commune}
                onChange={(e) => handleFilterChange('commune', e.target.value)}
              >
                <option value="">Toutes les communes</option>
                {communes && communes.map(commune => (
                  <option key={commune.id} value={commune.id}>
                    {commune.nom}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>⚡ État d'utilisation</Form.Label>
              <Form.Select
                value={filters.etat_utilisation}
                onChange={(e) => handleFilterChange('etat_utilisation', e.target.value)}
              >
                <option value="">Tous les états</option>
                <option value="inexploité">Inexploité</option>
                <option value="sous-utilisé">Sous-utilisé</option>
                <option value="optimisé">Optimisé</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Boutons d'action */}
        <div className="d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            {hasActiveFilters && (
              <span className="text-primary">
                ⚡ Filtres actifs
              </span>
            )}
          </div>
          
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            🗑️ Effacer les filtres
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RechercheFiltres;