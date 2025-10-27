import React, { useState, useEffect } from 'react';
import { Card, Badge, Row, Col, Button } from 'react-bootstrap';
import EditRessource from './EditRessource';
import { API_BASE_URL } from '../config';

// Styles Flutter-like pour les cartes
const resourceCardStyle = {
  background: 'var(--surface)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  marginBottom: '12px',
  boxShadow: 'var(--elevation-1)',
  border: '1px solid #f1f5f9',
  transition: 'all var(--transition-normal)',
  cursor: 'pointer'
};

const resourceCardHoverStyle = {
  boxShadow: 'var(--elevation-3)',
  transform: 'translateY(-2px)'
};

const ListeRessources = ({ ressources, selectedCommune, onRessourceUpdated, isMobile }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRessource, setSelectedRessource] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Récupérer l'utilisateur connecté au chargement
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        console.log('👤 Utilisateur chargé:', userObj);
      } catch (error) {
        console.error('Erreur parsing user:', error);
      }
    }
    setLoadingUser(false);
  }, []);

  const getCouleurPotentiel = (potentiel) => {
    switch(potentiel) {
      case 'élevé': return 'success';
      case 'moyen': return 'warning';
      case 'faible': return 'secondary';
      default: return 'light';
    }
  };

  const getIcône = (type) => {
    const icones = {
      'Agricole': '🌾',
      'Hydrique': '💧', 
      'Commerciale': '🏪',
      'Artisanale': '🛠️',
      'Touristique': '🏞️'
    };
    return icones[type] || '📍';
  };

  const handleEdit = (ressource) => {
    setSelectedRessource(ressource);
    setShowEditModal(true);
  };

  const handleDelete = async (ressource) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${ressource.nom}" ?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('❌ Vous devez être connecté pour supprimer une ressource');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ressources/${ressource.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        alert('❌ Vous n\'êtes pas autorisé à supprimer cette ressource');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('✅ Ressource supprimée avec succès!');
        if (onRessourceUpdated) {
          onRessourceUpdated();
        }
      } else {
        alert('❌ Erreur: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  // Vérifier si l'utilisateur peut modifier/supprimer une ressource
  const canModify = (ressource) => {
    if (loadingUser) {
      return false;
    }
    
    if (!user) {
      return false;
    }
  
    console.log('=== VÉRIFICATION PERMISSIONS ===');
    console.log('👤 Utilisateur:', user.nom, `(ID: ${user.id}, Rôle: ${user.role})`);
    console.log('📝 Ressource:', ressource.nom, `(Créée par: ${ressource.created_by})`);
    
    // Consultant ne peut JAMAIS modifier
    if (user.role === 'consultant') {
      console.log('❌ CONSULTANT - Accès lecture seule uniquement');
      return false;
    }
    
    // Admin peut tout modifier
    if (user.role === 'admin') {
      console.log('✅ ADMIN - Accès complet à toutes les ressources');
      return true;
    }
    
    // Éditeur peut modifier seulement SES ressources
    if (user.role === 'editeur') {
      if (ressource.created_by === user.id) {
        console.log('✅ ÉDITEUR - Propriétaire de la ressource');
        return true;
      } else {
        console.log('❌ ÉDITEUR - Pas propriétaire de cette ressource');
        return false;
      }
    }
    
    console.log('❌ Rôle inconnu ou sans permissions');
    return false;
  };

  if (loadingUser) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 20px',
        color: 'var(--on-background)'
      }}>
        <div className="flutter-spinner" style={{ marginBottom: '16px' }}></div>
        <p>Chargement des permissions...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Afficher le rôle actuel pour debug */}
      {user && (
        <div className="flutter-card" style={{ 
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          marginBottom: '16px',
          padding: '12px 16px'
        }}>
          <small style={{ color: 'var(--primary-700)' }}>
            <strong>Rôle actuel:</strong> {user.role} | 
            <strong> Utilisateur:</strong> {user.nom} |
            <strong> ID:</strong> {user.id}
          </small>
        </div>
      )}
      
      <h4 style={{ 
        marginBottom: '20px',
        color: 'var(--on-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📋</span>
        Ressources du Territoire
        <span className="flutter-chip" style={{ marginLeft: '8px' }}>
          {ressources ? ressources.length : 0}
        </span>
      </h4>

      {/* CORRECTION ICI : "ressources" au lieu de "ressources" */}
      {!ressources || ressources.length === 0 ? (
        <div 
          className="flutter-card" 
          style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: 'var(--on-background)'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <p style={{ marginBottom: '8px', fontWeight: '600' }}>
            Aucune ressource trouvée
          </p>
          <small style={{ color: 'var(--on-background)' }}>
            Ajoutez des ressources via le bouton "➕ Ajouter"
          </small>
        </div>
      ) : (
        ressources.map((ressource) => (
          <div 
            key={ressource.id}
            style={resourceCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = resourceCardHoverStyle.boxShadow;
              e.currentTarget.style.transform = resourceCardHoverStyle.transform;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = resourceCardStyle.boxShadow;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, var(--primary-100), var(--primary-50))',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                {getIcône(ressource.type)}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: 'var(--on-surface)',
                  marginBottom: '4px'
                }}>
                  {ressource.nom}
                </h3>
                
                <p style={{ 
                  fontSize: '14px',
                  color: 'var(--on-background)',
                  marginBottom: '8px',
                  lineHeight: '1.4'
                }}>
                  {ressource.description}
                </p>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="flutter-chip">
                    {ressource.type}
                  </span>
                  <span className="flutter-chip" style={{
                    background: ressource.potentiel === 'élevé' ? '#dcfce7' : 
                               ressource.potentiel === 'moyen' ? '#fef9c3' : '#f3f4f6',
                    color: ressource.potentiel === 'élevé' ? '#166534' : 
                          ressource.potentiel === 'moyen' ? '#854d0e' : '#4b5563'
                  }}>
                    Potentiel: {ressource.potentiel}
                  </span>
                </div>
                
                {/* Boutons d'action */}
                {canModify(ressource) && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      className="flutter-btn tertiary"
                      onClick={() => handleEdit(ressource)}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      className="flutter-btn tertiary"
                      onClick={() => handleDelete(ressource)}
                      style={{ 
                        fontSize: '12px', 
                        padding: '6px 12px',
                        color: '#dc2626'
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                )}
                
                <small style={{ 
                  display: 'block',
                  marginTop: '8px',
                  color: 'var(--on-background)',
                  fontSize: '11px'
                }}>
                  ID: {ressource.id} • Créée par: {ressource.created_by} • 
                  Le: {new Date(ressource.created_at).toLocaleDateString()}
                </small>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal d'édition */}
      {selectedRessource && (
        <EditRessource 
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setSelectedRessource(null);
          }}
          ressource={selectedRessource}
          onRessourceUpdated={onRessourceUpdated}
        />
      )}
    </div>
  );
};

export default ListeRessources;