import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Form, Alert, Card, Row, Col } from 'react-bootstrap';
import { useNotifications } from '../Notifications';
import { API_BASE_URL } from '../../config';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { success, error } = useNotifications();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/utilisateurs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Erreur chargement utilisateurs');
      
      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Préparer les données à envoyer
      const dataToSend = {
        role: formData.role,
        actif: formData.actif,
        commune_id: formData.commune_id || null
      };
  
      // Ajouter le mot de passe seulement si fourni
      if (formData.nouveau_mot_de_passe) {
        dataToSend.nouveau_mot_de_passe = formData.nouveau_mot_de_passe;
      }
  
      const response = await fetch(`${API_BASE_URL}/admin/utilisateurs/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
  
      if (!response.ok) throw new Error('Erreur modification utilisateur');
  
      success('Utilisateur modifié avec succès !');
      setShowEditModal(false);
      loadUsers();
    } catch (err) {
      error('Erreur lors de la modification: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      editeur: 'warning', 
      consultant: 'info',
      agent_communal: 'success'
    };
    return <Badge bg={variants[role] || 'secondary'}>{role}</Badge>;
  };

  if (loading) {
    return (
      <Card className="flutter-card">
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des utilisateurs...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h4>👥 Gestion des Utilisateurs</h4>
          <p className="text-muted">
            Gérer les comptes utilisateurs et permissions ({users.length} utilisateurs)
          </p>
        </Col>
        <Col xs="auto">
          <Button className="flutter-btn primary" onClick={loadUsers}>
            🔄 Actualiser
          </Button>
        </Col>
      </Row>

      <Card className="flutter-card">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Commune</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <strong>{user.nom}</strong>
                    {user.id === JSON.parse(localStorage.getItem('user'))?.id && (
                      <Badge bg="info" className="ms-2">Vous</Badge>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{user.commune_id || 'N/A'}</td>
                  <td>
                    <Badge bg={user.actif ? 'success' : 'secondary'}>
                      {user.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleEditUser(user)}
                      disabled={user.id === JSON.parse(localStorage.getItem('user'))?.id}
                    >
                      ✏️ Modifier
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal d'édition */}
      <EditUserModal 
        show={showEditModal}
        user={selectedUser}
        onHide={() => setShowEditModal(false)}
        onSave={handleUpdateUser}
      />
    </div>
  );
};

// Modal d'édition des utilisateurs
// Modal d'édition des utilisateurs AVEC MOT DE PASSE
const EditUserModal = ({ show, user, onHide, onSave }) => {
  const [formData, setFormData] = useState({});
  const { error, success } = useNotifications();

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        actif: user.actif,
        commune_id: user.commune_id || '',
        nouveau_mot_de_passe: '' // Champ mot de passe vide par défaut
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.role) {
      error('Le rôle est obligatoire');
      return;
    }

    // Validation du mot de passe si fourni
    if (formData.nouveau_mot_de_passe && formData.nouveau_mot_de_passe.length < 6) {
      error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    onSave(formData);
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>✏️ Modifier l'utilisateur</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control type="text" value={user.nom} disabled />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={user.email} disabled />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Rôle *</Form.Label>
                <Form.Select 
                  value={formData.role || ''}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="">Sélectionner un rôle</option>
                  <option value="admin">Administrateur</option>
                  <option value="editeur">Éditeur</option>
                  <option value="consultant">Consultant</option>
                  <option value="agent_communal">Agent Communal</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Statut</Form.Label>
                <Form.Check
                  type="switch"
                  label="Compte actif"
                  checked={formData.actif || false}
                  onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* CHAMP MOT DE PASSE AJOUTÉ ICI */}
          <Form.Group className="mb-3">
            <Form.Label>Nouveau mot de passe</Form.Label>
            <Form.Control
              type="password"
              placeholder="Laisser vide pour ne pas changer"
              value={formData.nouveau_mot_de_passe || ''}
              onChange={(e) => setFormData({...formData, nouveau_mot_de_passe: e.target.value})}
            />
            <Form.Text className="text-muted">
              Laisser vide pour garder l'ancien mot de passe. Minimum 6 caractères.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Commune ID</Form.Label>
            <Form.Control
              type="number"
              value={formData.commune_id || ''}
              onChange={(e) => setFormData({...formData, commune_id: e.target.value})}
              placeholder="ID de la commune"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Annuler
          </Button>
          <Button type="submit" className="flutter-btn primary">
            💾 Sauvegarder
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
export default UserManagement;