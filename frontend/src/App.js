import React, { useState, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import CarteCommunale from './components/CarteCommunale';
import ListeRessources from './components/ListeRessources';
import Header from './components/Header';
import FormulaireRessource from './components/FormulaireRessource';
import LoginPage from './components/LoginPage';
import RechercheFiltres from './components/RechercheFiltres';
import Dashboard from './components/Dashboard';
import useMobile from './hooks/useMobile';
import { API_BASE_URL } from './config';
import ExportDonnees from './components/ExportDonnees';

// Import des notifications
import { NotificationProvider, useNotifications } from './components/Notifications';
import NotificationContainer from './components/Notifications';
import { TranslationProvider } from './hooks/useTranslation';

// Composant MobileNavigation
const MobileNavigation = ({ 
  activeView, 
  setActiveView, 
  showFilters, 
  setShowFilters, 
  showList, 
  setShowList, 
  filters, 
  ressourcesFiltrees,
  onLogout,
  user
}) => {
  
  const handleCartePress = () => {
    setActiveView('carte');
    setShowFilters(false);
    setShowList(false);
  };

  const handleDashboardPress = () => {
    setActiveView('dashboard');
    setShowFilters(false);
    setShowList(false);
  };

  const handleFiltersPress = () => {
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);
    if (newShowFilters) {
      setShowList(false);
      setActiveView('carte');
    }
  };

  const handleListPress = () => {
    const newShowList = !showList;
    setShowList(newShowList);
    if (newShowList) {
      setShowFilters(false);
      setActiveView('carte');
    }
  };

  return (
    <div className="flutter-bottom-nav">
      <button 
        className={`flutter-nav-item ${activeView === 'carte' ? 'active' : ''}`}
        onClick={handleCartePress}
      >
        <span className="icon">🗺️</span>
        <span className="label">Carte</span>
      </button>
      
      <button 
        className={`flutter-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
        onClick={handleDashboardPress}
      >
        <span className="icon">📊</span>
        <span className="label">Stats</span>
      </button>
      
      <button 
        className={`flutter-nav-item ${showFilters ? 'active' : ''}`}
        onClick={handleFiltersPress}
      >
        <span className="icon">🔍</span>
        <span className="label">Filtres</span>
        {Object.keys(filters).filter(key => filters[key]).length > 0 && (
          <span className="flutter-badge">
            {Object.keys(filters).filter(key => filters[key]).length}
          </span>
        )}
      </button>
      
      <button 
        className={`flutter-nav-item ${showList ? 'active' : ''}`}
        onClick={handleListPress}
      >
        <span className="icon">📋</span>
        <span className="label">Liste</span>
        <span className="flutter-badge" style={{ background: 'var(--primary-600)' }}>
          {ressourcesFiltrees.length}
        </span>
      </button>
      
      <button 
        className="flutter-nav-item"
        onClick={onLogout}
        title="Déconnexion"
        style={{ color: '#dc2626' }}
      >
        <span className="icon">🚪</span>
        <span className="label">Déco</span>
      </button>
    </div>
  );
};

// Composant AdminPanel simple
// Composant AdminPanel CORRIGÉ avec token
const AdminPanel = () => {
  const { success, error } = useNotifications();

  // Fonction pour faire des appels API avec le token
  const fetchWithToken = async (url, method = 'GET') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Token non trouvé. Veuillez vous reconnecter.');
        return null;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      error(`Erreur: ${err.message}`);
      return null;
    }
  };

  // Gestionnaires corrigés
  const handleUserManagement = async () => {
    const data = await fetchWithToken('http://localhost:5000/api/admin/utilisateurs');
    if (data) {
      // Ouvrir les données dans un nouvel onglet formatées
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>Gestion des Utilisateurs</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
              .success { color: green; }
            </style>
          </head>
          <body>
            <h1>👥 Gestion des Utilisateurs</h1>
            <p class="success">Données récupérées avec succès !</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <button onclick="window.close()">Fermer</button>
          </body>
        </html>
      `);
    }
  };

  const handleAuditLogs = async () => {
    const data = await fetchWithToken('http://localhost:5000/api/security/audit-logs');
    if (data) {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>Logs d'Audit</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
              .success { color: green; }
            </style>
          </head>
          <body>
            <h1>📊 Logs d'Audit</h1>
            <p class="success">Données récupérées avec succès !</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <button onclick="window.close()">Fermer</button>
          </body>
        </html>
      `);
    }
  };

  const handleSecurityReport = async () => {
    const data = await fetchWithToken('http://localhost:5000/api/security/security-report');
    if (data) {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>Rapport de Sécurité</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
              .success { color: green; }
            </style>
          </head>
          <body>
            <h1>🔐 Rapport de Sécurité</h1>
            <p class="success">Données récupérées avec succès !</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <button onclick="window.close()">Fermer</button>
          </body>
        </html>
      `);
    }
  };

  const handleDashboard = () => {
    window.location.href = '#dashboard';
  };

  return (
    <Container fluid className="mt-5 pt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="flutter-card elevated p-4">
            <h3 className="mb-4">⚙️ Panel d'Administration</h3>
            <p className="text-muted mb-4">
              Interface d'administration de la plateforme communale
            </p>
            
            <div className="row g-3">
              <div className="col-md-6">
                <div className="flutter-card p-3 text-center">
                  <h5>👥 Gestion Utilisateurs</h5>
                  <p className="text-muted small mb-3">
                    Gérer les comptes utilisateurs et permissions
                  </p>
                  <button 
                    className="flutter-btn primary"
                    onClick={handleUserManagement}
                  >
                    Ouvrir
                  </button>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="flutter-card p-3 text-center">
                  <h5>📊 Logs d'Audit</h5>
                  <p className="text-muted small mb-3">
                    Consulter l'historique des actions
                  </p>
                  <button 
                    className="flutter-btn primary"
                    onClick={handleAuditLogs}
                  >
                    Ouvrir
                  </button>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="flutter-card p-3 text-center">
                  <h5>🔐 Rapport Sécurité</h5>
                  <p className="text-muted small mb-3">
                    Statistiques de sécurité du système
                  </p>
                  <button 
                    className="flutter-btn primary"
                    onClick={handleSecurityReport}
                  >
                    Ouvrir
                  </button>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="flutter-card p-3 text-center">
                  <h5>📈 Statistiques</h5>
                  <p className="text-muted small mb-3">
                    Tableaux de bord avancés
                  </p>
                  <button 
                    className="flutter-btn secondary"
                    onClick={handleDashboard}
                  >
                    Tableau de bord
                  </button>
                </div>
              </div>
            </div>

            {/* Section de débogage */}
            <div className="mt-4 p-3" style={{ background: '#f8f9fa', borderRadius: '8px' }}>
              <h6>🐛 Débogage Token</h6>
              <button 
                className="btn btn-sm btn-outline-info me-2"
                onClick={() => {
                  const token = localStorage.getItem('token');
                  console.log('Token:', token);
                  alert(`Token présent: ${!!token}\nLongueur: ${token?.length} caractères`);
                }}
              >
                Vérifier Token
              </button>
              <button 
                className="btn btn-sm btn-outline-warning"
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  const test = await fetchWithToken('http://localhost:5000/api/security/security-report');
                  if (test) {
                    success('✅ Test réussi ! Token valide');
                  }
                }}
              >
                Tester Connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

// Composant App principal
const AppContent = () => {
  const isMobile = useMobile();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États de l'application (seulement si connecté)
  const [ressources, setRessources] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [showFormulaire, setShowFormulaire] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [ressourcesFiltrees, setRessourcesFiltrees] = useState([]);
  const [activeView, setActiveView] = useState('carte');
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);

  // Références pour éviter les déclenchements multiples de notifications
  const notificationsShown = useRef({
    welcome: false,
    loading: false,
    success: false
  });

  // Utilisation des notifications
  const { success, error, warning, info } = useNotifications();

  // Vérifier la connexion au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        
        if (!notificationsShown.current.welcome) {
          info(`Bienvenue de retour ${userObj.nom} !`);
          notificationsShown.current.welcome = true;
        }
        
        chargerDonnees();
      } catch (e) {
        console.error('Erreur parsing user data:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Filtrer les ressources quand la recherche ou les filtres changent
  useEffect(() => {
    if (user) {
      filtrerRessources();
    }
  }, [ressources, searchTerm, filters, user]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      if (!notificationsShown.current.loading) {
        info('Chargement des données...');
        notificationsShown.current.loading = true;
      }
      
      const reponseCommunes = await fetch(`${API_BASE_URL}/communes`);
      const dataCommunes = await reponseCommunes.json();
      setCommunes(dataCommunes.data || []);

      const reponseRessources = await fetch(`${API_BASE_URL}/ressources`);
      const dataRessources = await reponseRessources.json();
      setRessources(dataRessources.data || []);
      
      if (!notificationsShown.current.success) {
        success('Données chargées avec succès !');
        notificationsShown.current.success = true;
      }
      
    } catch (erreur) {
      console.error('❌ Erreur chargement données:', erreur);
      error('Erreur lors du chargement des données');
      notificationsShown.current.loading = false;
    } finally {
      setLoading(false);
    }
  };

  const filtrerRessources = () => {
    let filtered = ressources;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ressource =>
        ressource.nom.toLowerCase().includes(term) ||
        (ressource.description && ressource.description.toLowerCase().includes(term))
      );
    }

    if (filters.type) {
      filtered = filtered.filter(ressource => ressource.type === filters.type);
    }

    if (filters.potentiel) {
      filtered = filtered.filter(ressource => ressource.potentiel === filters.potentiel);
    }

    if (filters.commune) {
      filtered = filtered.filter(ressource => ressource.commune_id === parseInt(filters.commune));
    }

    if (filters.etat_utilisation) {
      filtered = filtered.filter(ressource => ressource.etat_utilisation === filters.etat_utilisation);
    }

    setRessourcesFiltrees(filtered);
  };

  const handleRessourceAdded = () => {
    success('✅ Ressource ajoutée avec succès !');
    chargerDonnees();
  };

  const handleLoginSuccess = (userData) => {
    notificationsShown.current = {
      welcome: true,
      loading: false,
      success: false
    };
    
    success(`👋 Bienvenue ${userData.nom} !`);
    setUser(userData);
    chargerDonnees();
  };

  const handleLogout = () => {
    notificationsShown.current = {
      welcome: false,
      loading: false,
      success: false
    };
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRessources([]);
    setCommunes([]);
    info('👋 Vous avez été déconnecté');
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleExport = (successExport, format, errorMsg) => {
    if (successExport) {
      success(`✅ Export ${format} réussi !`);
    } else {
      error(`❌ Erreur export ${format}: ${errorMsg}`);
    }
  };

  // Fonction renderActiveView CORRIGÉE
  const renderActiveView = () => {
    console.log('🔄 Vue active:', activeView);
    
    // Vue Dashboard
    if (activeView === 'dashboard') {
      return <Dashboard ressources={ressources} communes={communes} />;
    }

    // Vue Admin Panel
    if (activeView === 'admin') {
      return <AdminPanel />;
    }

    // Vue Carte (par défaut)
    return (
      <div className="main-content-wrapper">
        {/* Filtres mobiles */}
        {isMobile && showFilters && (
          <div className="mobile-filters-panel">
            <div className="mobile-filters-header">
              <h6>🔍 Recherche et Filtres</h6>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowFilters(false)}
              >
                ✕
              </button>
            </div>
            <RechercheFiltres 
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              communes={communes}
              isMobile={isMobile}
            />
          </div>
        )}

        {/* Liste mobile */}
        {isMobile && showList && (
          <div className="mobile-list-panel">
            <div className="mobile-list-header">
              <h6>📋 Ressources ({ressourcesFiltrees.length})</h6>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowList(false)}
              >
                ✕
              </button>
            </div>
            <div className="mobile-list-content">
              <ListeRessources 
                ressources={ressourcesFiltrees}
                selectedCommune={selectedCommune}
                onRessourceUpdated={handleRessourceAdded}
                isMobile={isMobile}
              />
            </div>
          </div>
        )}

        {/* Layout principal */}
        <div className="main-layout-container">
          <div className={`carte-section ${!isMobile ? 'with-sidebar' : 'full-width'}`}>
            {loading ? (
              <div className="loading-container">
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-2">Chargement de la carte...</p>
                </div>
              </div>
            ) : (
              <CarteCommunale 
                ressources={ressourcesFiltrees}
                communes={communes}
                onCommuneSelect={setSelectedCommune}
                isMobile={isMobile}
              />
            )}
          </div>
          
          {/* Sidebar desktop */}
          {!isMobile && (
            <div className="sidebar-section">
              <div className="sidebar-inner">
                <RechercheFiltres 
                  onSearchChange={handleSearchChange}
                  onFilterChange={handleFilterChange}
                  communes={communes}
                  isMobile={isMobile}
                />
                
                {/* Section Export */}
                <ExportDonnees 
                  ressources={ressourcesFiltrees}
                  onExportComplete={handleExport}
                  isMobile={isMobile}
                />
                
                <ListeRessources 
                  ressources={ressourcesFiltrees}
                  selectedCommune={selectedCommune}
                  onRessourceUpdated={handleRessourceAdded}
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Si pas connecté, afficher la page de connexion
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Si chargement en cours
  if (loading) {
    return (
      <div className="loading-fullscreen">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement de la plateforme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Header - caché en mobile */}
      {!isMobile && (
        <Header 
          onViewChange={setActiveView} 
          activeView={activeView}
          user={user}
          onLogout={handleLogout}
          isMobile={isMobile}
          onShowFormulaire={() => setShowFormulaire(true)}
        />
      )}
      
      {/* Contenu principal */}
      <div className="main-container">
        {renderActiveView()}
      </div>
  
      {/* Navigation mobile */}
      {isMobile && (
        <MobileNavigation 
          activeView={activeView}
          setActiveView={setActiveView}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          showList={showList}
          setShowList={setShowList}
          filters={filters}
          ressourcesFiltrees={ressourcesFiltrees}
          onLogout={handleLogout}
          user={user}
        />
      )}
  
      {/* Bouton ajouter mobile */}
      {isMobile && user && user.role !== 'consultant' && (
        <div className="mobile-add-floating-btn">
          <button className="floating-add-btn" onClick={() => setShowFormulaire(true)}>
            ➕
          </button>
        </div>
      )}
  
      <FormulaireRessource 
        show={showFormulaire}
        onHide={() => setShowFormulaire(false)}
        onRessourceAdded={handleRessourceAdded}
        isMobile={isMobile}
      />
    </div>
  );
};

// Wrapper avec le provider de notifications
function AppWithNotifications() {
  return (
    <TranslationProvider>
      <NotificationProvider>
        <AppContent />
        <NotificationContainer />
      </NotificationProvider>
    </TranslationProvider>
  );
}

export default AppWithNotifications;