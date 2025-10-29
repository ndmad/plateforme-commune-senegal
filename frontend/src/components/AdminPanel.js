import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Tab, Tabs } from 'react-bootstrap';

const AdminPanel = () => {
  const [key, setKey] = useState('users');

  return (
    <Container fluid className="mt-5 pt-4">
      <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
        <Tab eventKey="users" title="👥 Gestion Utilisateurs">
          <Card className="flutter-card">
            <Card.Body>
              <h5>Gestion des Utilisateurs</h5>
              <Button 
                variant="primary"
                onClick={() => window.open('http://localhost:5000/api/admin/utilisateurs', '_blank')}
              >
                Voir les utilisateurs (API)
              </Button>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="audit" title="📊 Logs d'Audit">
          <Card className="flutter-card">
            <Card.Body>
              <h5>Logs d'Audit</h5>
              <Button 
                variant="primary"
                onClick={() => window.open('http://localhost:5000/api/security/audit-logs', '_blank')}
              >
                Voir les logs d'audit
              </Button>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="security" title="🔐 Sécurité">
          <Card className="flutter-card">
            <Card.Body>
              <h5>Rapport de Sécurité</h5>
              <Button 
                variant="primary"
                onClick={() => window.open('http://localhost:5000/api/security/security-report', '_blank')}
              >
                Voir le rapport
              </Button>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminPanel;