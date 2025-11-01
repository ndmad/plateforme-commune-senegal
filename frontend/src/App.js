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

// Import des composants Admin améliorés
import UserManagement from './components/admin/UserManagement';
import SecurityDashboard from './components/admin/SecurityDashboard';

// Import des notifications
import { NotificationProvider, useNotifications } from './components/Notifications';
import NotificationContainer from './components/Notifications';
import { TranslationProvider } from './hooks/useTranslation';
import ANSDPanel from './components/ansd/ANSDPanel';

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

// Composant AdminPanel amélioré avec onglets
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { success, error } = useNotifications();

  const openDataWithToken = async (url, title) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Token non trouvé');
        return;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();

      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 1200px;
                margin: 0 auto;
              }
              pre { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 5px; 
                border: 1px solid #e9ecef;
                overflow-x: auto;
                font-size: 12px;
                max-height: 80vh;
                overflow-y: auto;
              }
              button { 
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 15px;
              }
              button:hover { background: #0056b3; }
              .success { color: #28a745; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${title}</h1>
              <p class="success">✅ Données récupérées avec succès</p>
              <pre>${JSON.stringify(data, null, 2)}</pre>
              <button onclick="window.close()">Fermer la fenêtre</button>
            </div>
          </body>
        </html>
      `);

      success(`${title} ouvert avec succès`);
    } catch (err) {
      error(`Erreur: ${err.message}`);
    }
  };

  const tabs = {
    dashboard: {
      title: '📊 Dashboard Sécurité',
      component: <SecurityDashboard />
    },
    users: {
      title: '👥 Gestion Utilisateurs',
      component: <UserManagement />
    },
  };

  return (
    <Container fluid className="mt-5 pt-4">
      <div className="row">
        <div className="col-12">
          <div className="flutter-card elevated">
            {/* En-tête Admin */}
            <div className="p-4 border-bottom">
              <div className="row align-items-center">
                <div className="col">
                  <h4 className="mb-1">⚙️ Administration de la Plateforme</h4>
                  <p className="text-muted mb-0">
                    Gestion complète des utilisateurs, sécurité et statistiques
                  </p>
                </div>
                <div className="col-auto">
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => openDataWithToken(
                        `${API_BASE_URL}/security/audit-logs`,
                        '📋 Logs d\'Audit Complets'
                      )}
                    >
                      📋 Logs Complets
                    </button>
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => openDataWithToken(
                        `${API_BASE_URL}/admin/utilisateurs`,
                        '🔗 API Utilisateurs'
                      )}
                    >
                      🔗 API Utilisateurs
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation par onglets */}
            <div className="px-4 pt-3">
              <div className="d-flex gap-2 border-bottom">
                {Object.entries(tabs).map(([key, { title }]) => (
                  <button
                    key={key}
                    className={`btn btn-sm ${activeTab === key ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab(key)}
                    style={{
                      borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                      marginBottom: '-1px'
                    }}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenu de l'onglet actif */}
            <div className="p-4">
              {tabs[activeTab]?.component}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

// Composants de vues séparés pour éviter l'erreur de hooks
const CarteView = ({ 
  loading, 
  ressourcesFiltrees, 
  communes, 
  selectedCommune, 
  setSelectedCommune, 
  isMobile, 
  showFilters, 
  setShowFilters, 
  showList, 
  setShowList, 
  handleSearchChange, 
  handleFilterChange,
  formulairePosition,
  mapPositionRequest
}) => {
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
              onRessourceUpdated={() => {}} // Cette fonction sera passée par le parent
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
              formulairePosition={formulairePosition}
              onMapPositionRequest={mapPositionRequest}
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
                onExportComplete={() => {}} // Cette fonction sera passée par le parent
                isMobile={isMobile}
              />

              <ListeRessources
                ressources={ressourcesFiltrees}
                selectedCommune={selectedCommune}
                onRessourceUpdated={() => {}} // Cette fonction sera passée par le parent
                isMobile={isMobile}
              />
            </div>
          </div>
        )}
      </div>
    </div>
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

  // NOUVEAUX ÉTATS POUR LA SYNCHRONISATION
  const [formulairePosition, setFormulairePosition] = useState(null);
  const [mapPositionRequest, setMapPositionRequest] = useState(null);

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

  // Gérer le changement de position depuis le formulaire
  const handleFormulairePositionChange = (position) => {
    if (position === 'getCurrent') {
      // Demander la position actuelle de la carte
      setMapPositionRequest('getCurrent');
      
      // Écouter la réponse de la carte
      const handlePositionResponse = (event) => {
        setFormulairePosition(event.detail);
        window.removeEventListener('mapPositionResponse', handlePositionResponse);
      };
      window.addEventListener('mapPositionResponse', handlePositionResponse);
      
      // Émettre l'événement de demande
      window.dispatchEvent(new CustomEvent('mapPositionRequest', { 
        detail: 'getCurrent' 
      }));
    } else {
      // Mettre à jour la position du formulaire
      setFormulairePosition(position);
    }
  };

  // Fonction renderActiveView CORRIGÉE - sans hooks conditionnels
  const renderActiveView = () => {
    console.log('🔄 Vue active:', activeView);

    switch (activeView) {
      case 'dashboard':
        return <Dashboard ressources={ressources} communes={communes} />;
      
      case 'admin':
        return <AdminPanel />;
      
      case 'ansd':
        return <ANSDPanel />;
      
      case 'carte':
      default:
        return (
          <CarteView
            loading={loading}
            ressourcesFiltrees={ressourcesFiltrees}
            communes={communes}
            selectedCommune={selectedCommune}
            setSelectedCommune={setSelectedCommune}
            isMobile={isMobile}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            showList={showList}
            setShowList={setShowList}
            handleSearchChange={handleSearchChange}
            handleFilterChange={handleFilterChange}
            formulairePosition={formulairePosition}
            mapPositionRequest={mapPositionRequest}
          />
        );
    }
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
        positionInitiale={formulairePosition}
        onPositionChange={handleFormulairePositionChange}
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