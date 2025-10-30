import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';

const Header = ({ onViewChange, activeView, user, onLogout, isMobile, onShowFormulaire }) => {
  const { t } = useTranslation();

  // ❌ CACHER COMPLÈTEMENT LE HEADER EN MOBILE
  if (isMobile) {
    return (
      <div style={{
        height: '0px',
        overflow: 'hidden',
        position: 'absolute',
        top: '-100px'
      }}>
        {/* Header caché mais présent pour éviter les erreurs */}
      </div>
    );
  }

  // Gestionnaires pour les menus admin - NAVIGATION INTERNE
  const handleUserManagement = () => {
    onViewChange('admin');
  };

  const handleAdvancedStatistics = () => {
    onViewChange('admin');
  };

  const handleSecurityReport = () => {
    onViewChange('admin');
  };

  return (
    <Navbar expand="lg" fixed="top" className="flutter-app-bar">
      <Container fluid style={{ padding: '0 16px' }}>
        {/* Logo/Brand */}
        <Navbar.Brand
          href="#"
          style={{
            fontWeight: '700',
            fontSize: '1.3rem',
            background: 'linear-gradient(45deg, var(--senegal-yellow), #ffffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            marginRight: '2rem'
          }}
        >
          🌍 {t('municipality')} {t('platform')}
        </Navbar.Brand>

        {/* Language Switcher */}
        <LanguageSwitcher isMobile={isMobile} />

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Navigation principale */}
          <Nav className="me-auto">
            <Nav.Link
              href="#carte"
              onClick={() => onViewChange('carte')}
              style={{
                padding: '8px 16px',
                margin: '0 4px',
                borderRadius: 'var(--radius-md)',
                color: activeView === 'carte' ? 'white' : 'rgba(255,255,255,0.8)',
                background: activeView === 'carte' ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: '500',
                transition: 'all var(--transition-fast)'
              }}
            >
              🗺️ {t('map')}
            </Nav.Link>
            <Nav.Link
              href="#dashboard"
              onClick={() => onViewChange('dashboard')}
              style={{
                padding: '8px 16px',
                margin: '0 4px',
                borderRadius: 'var(--radius-md)',
                color: activeView === 'dashboard' ? 'white' : 'rgba(255,255,255,0.8)',
                background: activeView === 'dashboard' ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: '500',
                transition: 'all var(--transition-fast)'
              }}
            >
              📊 {t('dashboard')}
            </Nav.Link>


            <Nav.Link
              href="#ansd"
              onClick={() => onViewChange('ansd')}
              style={{
                padding: '8px 16px',
                margin: '0 4px',
                borderRadius: 'var(--radius-md)',
                color: activeView === 'ansd' ? 'white' : 'rgba(255,255,255,0.8)',
                background: activeView === 'ansd' ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: '500',
                transition: 'all var(--transition-fast)'
              }}
            >
              🌍 Données ANSD
            </Nav.Link>

            {/* Menu Administration - SEULEMENT POUR ADMIN */}
            {user?.role === 'admin' && (
              <NavDropdown
                title={
                  <span style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: '500'
                  }}>
                    ⚙️ {t('administration')}
                  </span>
                }
                id="admin-nav-dropdown"
                style={{
                  margin: '0 4px'
                }}
              >
                <NavDropdown.Item
                  onClick={handleUserManagement}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  👥 {t('user_management')}
                </NavDropdown.Item>

                <NavDropdown.Item
                  onClick={handleAdvancedStatistics}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  📊 {t('advanced_statistics')}
                </NavDropdown.Item>

                <NavDropdown.Divider />

                <NavDropdown.Item
                  onClick={handleSecurityReport}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  🔐 {t('security_report')}
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          {/* Boutons utilisateur connecté */}
          <Nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Bouton Ajouter */}
            {user?.role !== 'consultant' && (
              <Button
                onClick={onShowFormulaire}
                className="flutter-btn primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px'
                }}
              >
                <span style={{ marginRight: '6px' }}>➕</span>
                {t('add')}
              </Button>
            )}

            {/* Menu utilisateur */}
            <NavDropdown
              title={
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white',
                  fontWeight: '500'
                }}>
                  <span style={{ marginRight: '8px' }}>👋</span>
                  {user.nom}
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    opacity: '0.9'
                  }}>
                    ({user.role})
                  </span>
                </span>
              }
              id="user-nav-dropdown"
              align="end"
            >
              <NavDropdown.ItemText
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: 'var(--on-background)'
                }}
              >
                <div>{t('municipality')}: {user.commune || t('unspecified')}</div>
                <div>{t('role')}: <strong>{user.role}</strong></div>
              </NavDropdown.ItemText>
              <NavDropdown.Divider />
              <NavDropdown.Item
                onClick={onLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
              >
                <span style={{ marginRight: '8px' }}>🚪</span>
                {t('logout')}
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;