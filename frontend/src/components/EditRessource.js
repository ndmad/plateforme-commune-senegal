import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';

const EditRessource = ({ show, onHide, ressource, onRessourceUpdated }) => {
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialiser le formulaire quand la ressource change
  useEffect(() => {
    if (ressource) {
      setFormData({
        nom: ressource.nom || '',
        description: ressource.description || '',
        potentiel: ressource.potentiel || 'moyen',
        etat_utilisation: ressource.etat_utilisation || 'sous-utilisé',
        contact_nom: ressource.contact_nom || '',
        contact_tel: ressource.contact_tel || ''
      });
    }
  }, [ressource]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const token = localStorage.getItem('token');
    
    if (!token) {
      setMessage('❌ Vous devez être connecté pour modifier une ressource');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/ressources/${ressource.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 403) {
        setMessage('❌ Vous n\'êtes pas autorisé à modifier cette ressource');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setMessage('✅ Ressource modifiée avec succès!');
        
        if (onRessourceUpdated) {
          onRessourceUpdated();
        }
        
        setTimeout(() => {
          onHide();
          setMessage('');
        }, 2000);
      } else {
        setMessage('❌ Erreur: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ressource) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>✏️ Modifier la Ressource</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {message && (
            <Alert variant={message.includes('✅') ? 'success' : 'danger'}>
              {message}
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Nom de la ressource *</Form.Label>
            <Form.Control
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Potentiel de valorisation</Form.Label>
                <Form.Select
                  name="potentiel"
                  value={formData.potentiel}
                  onChange={handleChange}
                >
                  <option value="faible">Faible</option>
                  <option value="moyen">Moyen</option>
                  <option value="élevé">Élevé</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>État d'utilisation</Form.Label>
                <Form.Select
                  name="etat_utilisation"
                  value={formData.etat_utilisation}
                  onChange={handleChange}
                >
                  <option value="inexploité">Inexploité</option>
                  <option value="sous-utilisé">Sous-utilisé</option>
                  <option value="optimisé">Optimisé</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact (nom)</Form.Label>
                <Form.Control
                  type="text"
                  name="contact_nom"
                  value={formData.contact_nom}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  name="contact_tel"
                  value={formData.contact_tel}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="text-muted small">
            <strong>Type:</strong> {ressource.type} <br />
            <strong>Créée le:</strong> {new Date(ressource.created_at).toLocaleDateString()}
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Modification...' : '💾 Enregistrer'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditRessource;