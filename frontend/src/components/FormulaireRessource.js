import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import MiniCarteLocalisation from './MiniCarteLocalisation';

// STYLES OPTIMISÉS
const modalStyles = {
  modalContent: {
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '0',
    maxHeight: 'calc(90vh - 140px)'
  },
  formField: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: 'var(--on-surface)',
    fontSize: '13px'
  },
  mapContainer: {
    height: '250px',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '2px solid var(--primary-200)'
  },
  tabContent: {
    padding: '20px'
  }
};

function FormulaireRessource({ show, onHide, positionInitiale, onPositionChange }) {
  // Utiliser la position initiale si fournie, sinon valeur par défaut
  const [formData, setFormData] = useState({
    nom: '',
    type_ressource_id: '',
    description: '',
    potentiel: 'faible',
    etat_utilisation: 'inexploité',
    contact_nom: '',
    contact_tel: '',
    latitude: positionInitiale?.lat?.toString() || '14.764504',
    longitude: positionInitiale?.lng?.toString() || '-17.366029'
  });

  const [message, setMessage] = useState('');
  const [typesRessources, setTypesRessources] = useState([]);
  const [activeTab, setActiveTab] = useState('localisation');

  // Mettre à jour les coordonnées quand positionInitiale change
  useEffect(() => {
    if (positionInitiale) {
      setFormData(prev => ({
        ...prev,
        latitude: positionInitiale.lat.toString(),
        longitude: positionInitiale.lng.toString()
      }));
    }
  }, [positionInitiale]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Données soumises:', formData);
    // Votre logique de soumission ici
  };

  const handlePositionChange = (lat, lng) => {
    const newFormData = {
      ...formData,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    };
    setFormData(newFormData);
    
    // Notifier le composant parent du changement de position
    if (onPositionChange) {
      onPositionChange({ lat, lng });
    }
  };

  // Fonction pour récupérer la position actuelle de la carte
  const handleGetCurrentMapPosition = () => {
    if (onPositionChange) {
      // Demander au parent la position actuelle de la carte
      onPositionChange('getCurrent');
    }
  };

  useEffect(() => {
    setTypesRessources([
      { id: 1, type: 'Terrain agricole', categorie: 'Agricole' },
      { id: 2, type: 'Bâtiment public', categorie: 'Immobilier' },
      { id: 3, type: 'Site touristique', categorie: 'Tourisme' },
      { id: 4, type: 'Commerce', categorie: 'Économique' },
      { id: 5, type: 'Ressource naturelle', categorie: 'Environnement' },
    ]);
  }, []);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <div className="flutter-card" style={{ 
        margin: 0, 
        border: 'none', 
        borderRadius: 'var(--radius-xl)',
        ...modalStyles.modalContent
      }}>
        <Modal.Header closeButton style={{ 
          borderBottom: '1px solid #f1f5f9',
          padding: '20px 20px 15px',
          flexShrink: 0
        }}>
          <Modal.Title style={{ 
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--on-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ➕ Nouvelle Ressource Communale
          </Modal.Title>
        </Modal.Header>

        {/* NAVIGATION PAR ONGLETS */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #f1f5f9',
          padding: '0 20px',
          background: 'var(--background)'
        }}>
          <button
            type="button"
            className={`btn ${activeTab === 'localisation' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('localisation')}
            style={{ 
              fontSize: '13px', 
              padding: '12px 16px',
              borderRadius: '0',
              border: 'none',
              borderBottom: activeTab === 'localisation' ? '2px solid var(--primary-500)' : '2px solid transparent'
            }}
          >
            📍 Localisation
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'informations' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('informations')}
            style={{ 
              fontSize: '13px', 
              padding: '12px 16px',
              borderRadius: '0',
              border: 'none',
              borderBottom: activeTab === 'informations' ? '2px solid var(--primary-500)' : '2px solid transparent'
            }}
          >
            📝 Informations
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'contacts' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('contacts')}
            style={{ 
              fontSize: '13px', 
              padding: '12px 16px',
              borderRadius: '0',
              border: 'none',
              borderBottom: activeTab === 'contacts' ? '2px solid var(--primary-500)' : '2px solid transparent'
            }}
          >
            👥 Contacts
          </button>
        </div>

        <Form onSubmit={handleSubmit}>
          <Modal.Body style={modalStyles.modalBody}>
            
            {message && (
              <div style={{
                padding: '12px 20px',
                background: message.includes('✅') ? 'var(--primary-50)' : '#fef2f2',
                color: message.includes('✅') ? 'var(--primary-700)' : '#dc2626',
                border: `1px solid ${message.includes('✅') ? 'var(--primary-200)' : '#fecaca'}`,
                margin: '0',
                fontSize: '13px'
              }}>
                {message}
              </div>
            )}

            {/* ONGLET LOCALISATION */}
            {activeTab === 'localisation' && (
              <div style={modalStyles.tabContent}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🗺️</div>
                  <h3 style={{ color: 'var(--primary-500)', marginBottom: '8px' }}>Localisez la ressource</h3>
                  <p style={{ color: 'var(--on-background)', fontSize: '14px' }}>
                    Cliquez sur la carte pour positionner précisément votre ressource
                  </p>
                </div>

                {/* BOUTONS DE SYNCHRONISATION */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginBottom: '15px',
                  justifyContent: 'center'
                }}>
                  <button 
                    type="button"
                    className="flutter-btn secondary"
                    onClick={handleGetCurrentMapPosition}
                    style={{ fontSize: '12px', padding: '8px 12px' }}
                  >
                    📍 Utiliser position carte
                  </button>
                </div>

                <div style={modalStyles.formField}>
                  <div style={modalStyles.mapContainer}>
                    <MiniCarteLocalisation
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onPositionChange={handlePositionChange}
                      height="250px"
                    />
                  </div>
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px',
                    background: 'var(--primary-50)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: 'var(--primary-700)'
                  }}>
                    <strong>📍 Position sélectionnée :</strong><br />
                    Latitude: {formData.latitude} | Longitude: {formData.longitude}
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '20px',
                  justifyContent: 'center'
                }}>
                  <button 
                    type="button"
                    className="flutter-btn secondary"
                    onClick={() => setActiveTab('informations')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    ← Retour
                  </button>
                  <button 
                    type="button"
                    className="flutter-btn primary"
                    onClick={() => setActiveTab('informations')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    Suivant : Informations →
                  </button>
                </div>
              </div>
            )}

             {/* ONGLET LOCALISATION */}
             {activeTab === 'localisation' && (
              <div style={modalStyles.tabContent}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🗺️</div>
                  <h3 style={{ color: 'var(--primary-500)', marginBottom: '8px' }}>Localisez la ressource</h3>
                  <p style={{ color: 'var(--on-background)', fontSize: '14px' }}>
                    Cliquez sur la carte pour positionner précisément votre ressource
                  </p>
                </div>

                <div style={modalStyles.formField}>
                  <div style={modalStyles.mapContainer}>
                    <MiniCarteLocalisation
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onPositionChange={handlePositionChange}
                      height="250px"
                    />
                  </div>
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px',
                    background: 'var(--primary-50)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: 'var(--primary-700)'
                  }}>
                    <strong>📍 Position sélectionnée :</strong><br />
                    Latitude: {formData.latitude} | Longitude: {formData.longitude}
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '20px',
                  justifyContent: 'center'
                }}>
                  <button 
                    type="button"
                    className="flutter-btn secondary"
                    onClick={() => setActiveTab('informations')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    ← Retour
                  </button>
                  <button 
                    type="button"
                    className="flutter-btn primary"
                    onClick={() => setActiveTab('informations')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    Suivant : Informations →
                  </button>
                </div>
              </div>
            )}

            {/* ONGLET INFORMATIONS */}
            {activeTab === 'informations' && (
              <div style={modalStyles.tabContent}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📝</div>
                  <h3 style={{ color: 'var(--primary-500)', marginBottom: '8px' }}>Décrivez la ressource</h3>
                </div>

                <div style={modalStyles.formField}>
                  <label style={modalStyles.label}>
                    Nom de la ressource *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Ex: Marché central de Dakar, Zone maraîchère..."
                    required
                    className="flutter-input"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div style={modalStyles.formField}>
                  <label style={modalStyles.label}>
                    Type de ressource *
                  </label>
                  <select
                    name="type_ressource_id"
                    value={formData.type_ressource_id}
                    onChange={handleChange}
                    required
                    className="flutter-input"
                    style={{ 
                      fontSize: '14px',
                      appearance: 'none', 
                      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"%23666\" d=\"M2 0L0 2h4zm0 5L0 3h4z\"/></svg>")', 
                      backgroundRepeat: 'no-repeat', 
                      backgroundPosition: 'right 12px center', 
                      backgroundSize: '8px 10px',
                      paddingRight: '30px'
                    }}
                  >
                    <option value="">Sélectionnez un type</option>
                    {typesRessources.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.type} - {type.categorie}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={modalStyles.formField}>
                  <label style={modalStyles.label}>
                    Description détaillée
                  </label>
                  <textarea
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Décrivez la ressource : état, caractéristiques, historique, potentiel..."
                    className="flutter-input"
                    style={{ 
                      resize: 'vertical', 
                      minHeight: '80px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={modalStyles.formField}>
                    <label style={modalStyles.label}>
                      Potentiel de valorisation
                    </label>
                    <select
                      name="potentiel"
                      value={formData.potentiel}
                      onChange={handleChange}
                      className="flutter-input"
                      style={{ fontSize: '14px' }}
                    >
                      <option value="faible">Faible</option>
                      <option value="moyen">Moyen</option>
                      <option value="élevé">Élevé</option>
                      <option value="très élevé">Très élevé</option>
                    </select>
                  </div>

                  <div style={modalStyles.formField}>
                    <label style={modalStyles.label}>
                      État d'utilisation
                    </label>
                    <select
                      name="etat_utilisation"
                      value={formData.etat_utilisation}
                      onChange={handleChange}
                      className="flutter-input"
                      style={{ fontSize: '14px' }}
                    >
                      <option value="inexploité">Inexploité</option>
                      <option value="sous-utilisé">Sous-utilisé</option>
                      <option value="optimisé">Optimisé</option>
                      <option value="saturé">Saturé</option>
                    </select>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '25px',
                  justifyContent: 'space-between'
                }}>
                  <button 
                    type="button"
                    className="flutter-btn secondary"
                    onClick={() => setActiveTab('localisation')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    ← Localisation
                  </button>
                  <button 
                    type="button"
                    className="flutter-btn primary"
                    onClick={() => setActiveTab('contacts')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    Suivant : Contacts →
                  </button>
                </div>
              </div>
            )}

            {/* ONGLET CONTACTS */}
            {activeTab === 'contacts' && (
              <div style={modalStyles.tabContent}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👥</div>
                  <h3 style={{ color: 'var(--primary-500)', marginBottom: '8px' }}>Informations de contact</h3>
                  <p style={{ color: 'var(--on-background)', fontSize: '14px' }}>
                    Personne responsable ou à contacter pour cette ressource
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={modalStyles.formField}>
                    <label style={modalStyles.label}>
                      Nom du contact
                    </label>
                    <input
                      type="text"
                      name="contact_nom"
                      value={formData.contact_nom}
                      onChange={handleChange}
                      placeholder="Ex: M. Diop, Responsable..."
                      className="flutter-input"
                      style={{ fontSize: '14px' }}
                    />
                  </div>

                  <div style={modalStyles.formField}>
                    <label style={modalStyles.label}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="contact_tel"
                      value={formData.contact_tel}
                      onChange={handleChange}
                      placeholder="77 123 45 67"
                      className="flutter-input"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={modalStyles.formField}>
                  <label style={modalStyles.label}>
                    Informations complémentaires
                  </label>
                  <textarea
                    rows={2}
                    name="contact_info"
                    onChange={handleChange}
                    placeholder="Autres informations de contact, horaires, disponibilités..."
                    className="flutter-input"
                    style={{ 
                      resize: 'vertical', 
                      minHeight: '60px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* RÉCAPITULATIF */}
                <div style={{ 
                  marginTop: '25px',
                  padding: '16px',
                  background: 'var(--primary-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--primary-200)'
                }}>
                  <h4 style={{ color: 'var(--primary-700)', marginBottom: '12px' }}>📋 Récapitulatif</h4>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <div><strong>Ressource :</strong> {formData.nom || 'Non renseigné'}</div>
                    <div><strong>Localisation :</strong> {formData.latitude}, {formData.longitude}</div>
                    <div><strong>Type :</strong> {typesRessources.find(t => t.id == formData.type_ressource_id)?.type || 'Non sélectionné'}</div>
                    <div><strong>Potentiel :</strong> {formData.potentiel}</div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '25px',
                  justifyContent: 'space-between'
                }}>
                  <button 
                    type="button"
                    className="flutter-btn secondary"
                    onClick={() => setActiveTab('informations')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    ← Informations
                  </button>
                  <button 
                    type="submit"
                    className="flutter-btn primary"
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    💾 Enregistrer la Ressource
                  </button>
                </div>
              </div>
            )}

            
          </Modal.Body>
        </Form>
      </div>
    </Modal>
  );
}

export default FormulaireRessource;