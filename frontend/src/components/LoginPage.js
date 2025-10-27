import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import './LoginPage.css';
import { API_BASE_URL } from '../config'; // ← AJOUT

const LoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, { // ← MODIFIÉ
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();

      if (result.success) {
        setMessage('✅ Connexion réussie! Redirection...');
        
        // Sauvegarder le token et les infos utilisateur
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        // Appeler le callback de succès après un délai
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(result.data.user);
          }
        }, 1500);
      } else {
        setMessage('❌ ' + (result.error || 'Email ou mot de passe incorrect'));
      }
    } catch (error) {
      setMessage('❌ Erreur de connexion au serveur');
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-dark">
      {/* Background animé */}
      <div className="login-background">
        <div className="login-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <Container fluid className="login-container-dark">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} sm={10} md={8} lg={6} xl={4}>
            {/* Carte de connexion centrée */}
            <div className="login-card-wrapper">
            
<Card className="login-card-dark">
  <Card.Body className="p-4"> {/* Changé de p-5 à p-4 */}
    {/* En-tête */}
    <div className="text-center mb-4">
      <div className="login-logo-dark">
        <span className="logo-icon-dark">🌍</span>
      </div>
      <h2 className="login-title-dark">Plateforme Communale</h2>
      <p className="login-subtitle">Sénégal - Gestion Territoriale</p>
    </div>

    {/* Message d'alerte */}
    {message && (
      <Alert 
        variant={message.includes('✅') ? 'success' : 'danger'} 
        className="login-alert mb-3"
      >
        {message}
      </Alert>
    )}

    {/* Formulaire */}
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label className="login-label">Email</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="votre@email.com"
          required
          className="login-input-dark"
          disabled={isLoading}
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className="login-label">Mot de passe</Form.Label>
        <Form.Control
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Votre mot de passe"
          required
          className="login-input-dark"
          disabled={isLoading}
        />
      </Form.Group>

      <Button 
        variant="primary" 
        type="submit"
        disabled={isLoading}
        className="login-btn-dark w-100"
        size="lg"
      >
        {isLoading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Connexion en cours...
          </>
        ) : (
          <>
            <span className="btn-icon">🔐</span>
            Se connecter
          </>
        )}
      </Button>
    </Form>

    {/* Footer */}
    <div className="text-center mt-4">
      <small className="login-footer-text">
        Accès réservé aux agents communaux autorisés
      </small>
    </div>
  </Card.Body>
</Card>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Footer global */}
      <div className="login-global-footer">
        <p>&copy; 2024 Plateforme des Ressources Communales - Sénégal</p>
      </div>
    </div>
  );
};

export default LoginPage;