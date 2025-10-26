import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';

const Header = ({ onViewChange, activeView, user, onLogout, isMobile, onShowLogin, onShowFormulaire }) => {
  return (
    <Navbar bg="primary" variant="dark" expand="lg" fixed="top">
      <Container>
        {/* Logo/Brand */}
        <Navbar.Brand href="#" className="d-flex align-items-center">
          {isMobile ? '🌍 Plateforme' : '🌍 Plateforme des Ressources Communales'}
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Navigation principale */}
          <Nav className="me-auto">
            <Nav.Link 
              href="#carte"
              active={activeView === 'carte'}
              onClick={() => onViewChange('carte')}
              className="d-flex align-items-center"
            >
              🗺️ Carte
            </Nav.Link>
            <Nav.Link 
              href="#dashboard"
              active={activeView === 'dashboard'}
              onClick={() => onViewChange('dashboard')}
              className="d-flex align-items-center"
            >
              📊 Dashboard
            </Nav.Link>
            {user?.role === 'admin' && (
              <NavDropdown title="⚙️ Administration" id="admin-nav-dropdown" className="d-flex align-items-center">
                <NavDropdown.Item href="#utilisateurs">
                  👥 Gestion Utilisateurs
                </NavDropdown.Item>
                <NavDropdown.Item href="#statistiques">
                  📈 Statistiques Avancées
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
          
          {/* Boutons de connexion/actions - CACHÉS EN MOBILE */}
          {!isMobile && (
            <Nav className="align-items-center">
              {user ? (
                // Utilisateur connecté
                <>
                  {/* Bouton Ajouter */}
                  <Button 
                    variant="outline-light" 
                    size="sm"
                    onClick={onShowFormulaire}
                    className="me-2 d-flex align-items-center"
                  >
                    <span className="me-1">➕</span>
                    Ajouter
                  </Button>
                  
                  {/* Menu utilisateur */}
                  <NavDropdown 
                    title={
                      <span className="d-flex align-items-center">
                        <span className="me-1">👋</span>
                        {user.nom}
                        <span className="ms-1">({user.role})</span>
                      </span>
                    } 
                    id="user-nav-dropdown"
                    align="end"
                  >
                    <NavDropdown.ItemText className="small">
                      <div>Commune: {user.commune || 'Non spécifiée'}</div>
                      <div>Rôle: <strong>{user.role}</strong></div>
                    </NavDropdown.ItemText>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={onLogout} className="d-flex align-items-center">
                      <span className="me-2">🚪</span>
                      Déconnexion
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                // Utilisateur non connecté
                <>
                  <Button 
                    variant="outline-light" 
                    size="sm"
                    onClick={onShowLogin}
                    className="me-2 d-flex align-items-center"
                  >
                    <span className="me-1">🔐</span>
                    Connexion
                  </Button>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={onShowLogin}
                    className="d-flex align-items-center"
                  >
                    <span className="me-1">➕</span>
                    Ajouter
                  </Button>
                </>
              )}
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;