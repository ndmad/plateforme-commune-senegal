import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge } from 'react-bootstrap';
import { useNotifications } from '../Notifications';
import { API_BASE_URL } from '../../config';

const SecurityDashboard = () => {
  const [securityData, setSecurityData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, success } = useNotifications();

  // Fonction helper pour les appels API avec token
  const fetchWithToken = async (url) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
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

      return await response.json();
    } catch (err) {
      error(`Erreur: ${err.message}`);
      return null;
    }
  };

  // Fonction pour ouvrir les données formatées
  const openFormattedData = (data, title) => {
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
  };

  useEffect(() => {
    loadSecurityData();
    loadRecentAuditLogs();
  }, []);

  const loadSecurityData = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/security/security-report`);
      if (data) {
        setSecurityData(data.data);
      }
    } catch (err) {
      error('Erreur chargement données sécurité');
    }
  };

  const loadRecentAuditLogs = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/security/audit-logs?limit=10`);
      if (data) {
        setAuditLogs(data.data || []);
      }
    } catch (err) {
      error('Erreur chargement logs audit');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const variants = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'danger',
      LOGIN: 'info',
      LOGOUT: 'secondary',
      VIEW: 'primary'
    };
    return <Badge bg={variants[action] || 'dark'}>{action}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const handleOpenAuditLogs = async () => {
    const data = await fetchWithToken(`${API_BASE_URL}/security/audit-logs`);
    if (data) {
      openFormattedData(data, '📊 Logs d\'Audit Complets');
    }
  };

  const handleOpenUsers = async () => {
    const data = await fetchWithToken(`${API_BASE_URL}/admin/utilisateurs`);
    if (data) {
      openFormattedData(data, '👥 Liste des Utilisateurs');
    }
  };

  const handleGenerateReport = async () => {
    success('Génération du rapport en cours...');
    
    const auditData = await fetchWithToken(`${API_BASE_URL}/security/audit-logs?limit=50`);
    const usersData = await fetchWithToken(`${API_BASE_URL}/admin/utilisateurs`);
    const securityData = await fetchWithToken(`${API_BASE_URL}/security/security-report`);
    
    if (auditData && usersData && securityData) {
      const reportData = {
        generatedAt: new Date().toISOString(),
        security: securityData,
        users: usersData,
        audit: auditData,
        summary: {
          totalUsers: usersData.data?.length || 0,
          recentActivities: auditData.data?.length || 0,
          systemStatus: securityData.systemStatus
        }
      };
      
      openFormattedData(reportData, '📈 Rapport de Sécurité Complet');
    }
  };

  if (loading) {
    return (
      <Card className="flutter-card">
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement du dashboard sécurité...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <h4 className="mb-4">🔐 Dashboard de Sécurité</h4>

      {/* Cartes de statistiques */}
      {securityData && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="flutter-card text-center">
              <Card.Body>
                <h2>👥</h2>
                <h4>{securityData.totalUsers}</h4>
                <p className="text-muted mb-0">Utilisateurs total</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="flutter-card text-center">
              <Card.Body>
                <h2>✅</h2>
                <h4>{securityData.activeUsers}</h4>
                <p className="text-muted mb-0">Utilisateurs actifs</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="flutter-card text-center">
              <Card.Body>
                <h2>📊</h2>
                <h4>{securityData.recentActivities}</h4>
                <p className="text-muted mb-0">Activités (24h)</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="flutter-card text-center">
              <Card.Body>
                <h2>🛡️</h2>
                <h4 className={securityData.systemStatus === 'OK' ? 'text-success' : 'text-danger'}>
                  {securityData.systemStatus}
                </h4>
                <p className="text-muted mb-0">Statut système</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Activités récentes et Actions rapides */}
      <Row>
        <Col md={8}>
          <Card className="flutter-card">
            <Card.Header>
              <h5 className="mb-0">📋 Activités Récentes</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Table</th>
                    <th>Utilisateur</th>
                    <th>Date</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{getActionBadge(log.action)}</td>
                      <td>
                        <Badge bg="outline-secondary">{log.table_name}</Badge>
                        {log.record_id && ` #${log.record_id}`}
                      </td>
                      <td>{log.user_name || 'Système'}</td>
                      <td className="text-muted small">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="text-muted small">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="flutter-card">
            <Card.Header>
              <h5 className="mb-0">⚡ Actions Rapides</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-outline-primary"
                  onClick={handleOpenAuditLogs}
                >
                  📊 Voir tous les logs
                </button>
                
                <button 
                  className="btn btn-outline-success"
                  onClick={handleOpenUsers}
                >
                  👥 Gestion utilisateurs
                </button>
                
                <button 
                  className="btn btn-outline-info"
                  onClick={handleGenerateReport}
                >
                  📈 Rapport complet
                </button>
                
                <button 
                  className="btn btn-outline-warning"
                  onClick={() => {
                    success('Fonctionnalité de sauvegarde à venir...');
                  }}
                >
                  🔄 Sauvegarde
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SecurityDashboard;