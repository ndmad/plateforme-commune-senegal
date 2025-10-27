import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';

const Header = ({ onViewChange, activeView, user, onLogout, isMobile, onShowFormulaire }) => {
  // ❌ CACHER COMPLÈTEMENT LE HEADER EN MOBILE
  if (isMobile) {
    return null;
  }

  return (
    <Navbar bg="primary" variant="dark" expand="lg" fixed="top" className="navbar-custom">
      <Container fluid className="navbar-container">
        {/* Logo/Brand */}
        <Navbar.Brand href="#" className="navbar-brand-custom">
          🌍 Plateforme des Ressources Communales
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="navbar-collapse-custom">
          {/* Navigation principale */}
          <Nav className="me-auto">
            <Nav.Link
              href="#carte"
              active={activeView === 'carte'}
              onClick={() => onViewChange('carte')}
              className="nav-link-custom"
            >
              🗺️ Carte
            </Nav.Link>
            <Nav.Link
              href="#dashboard"
              active={activeView === 'dashboard'}
              onClick={() => onViewChange('dashboard')}
              className="nav-link-custom"
            >
              📊 Dashboard
            </Nav.Link>
            {user?.role === 'admin' && (
              <NavDropdown title="⚙️ Administration" id="admin-nav-dropdown" className="nav-dropdown-custom">
                <NavDropdown.Item href="#utilisateurs">
                  👥 Gestion Utilisateurs
                </NavDropdown.Item>
                <NavDropdown.Item href="#statistiques">
                  📈 Statistiques Avancées
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          {/* Boutons utilisateur connecté */}
          <Nav className="navbar-buttons-custom">
            {user?.role !== 'consultant' && (
              <Button
                variant="outline-light"
                size="sm"
                onClick={onShowFormulaire}
                className="add-btn-custom"
              >
                <span className="me-1">➕</span>
                Ajouter
              </Button>
            )}

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
              className="user-dropdown-custom"
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;