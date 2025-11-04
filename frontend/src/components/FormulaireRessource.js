// components/FormulaireRessource.js
import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import MiniCarteLocalisation from './MiniCarteLocalisation';
import { API_BASE_URL } from '../config';

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
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    borderRadius: 'var(--radius-xl)'
  }
};

function FormulaireRessource({ show, onHide, positionInitiale, onPositionChange, onRessourceAdded }) {
  // États avec valeurs par défaut robustes
  const [formData, setFormData] = useState({
    nom: '',
    type_ressource_id: '',
    description: '',
    potentiel: 'faible',
    etat_utilisation: 'inexploité',
    contact_nom: '',
    contact_tel: '',
    latitude: positionInitiale?.lat?.toString() || '14.764504',
    longitude: positionInitiale?.lng?.toString() || '-17.366029',
    commune_id: '1' // Toujours une valeur par défaut
  });

  const [message, setMessage] = useState('');
  const [typesRessources, setTypesRessources] = useState([
    { id: 1, type: 'Terrain agricole', categorie: 'Agricole' },
    { id: 2, type: 'Bâtiment public', categorie: 'Immobilier' },
    { id: 3, type: 'Site touristique', categorie: 'Tourisme' },
    { id: 4, type: 'Commerce', categorie: 'Économique' },
    { id: 5, type: 'Ressource naturelle', categorie: 'Environnement' },
    { id: 6, type: 'Point d\'eau', categorie: 'Hydrique' },
    { id: 7, type: 'Équipement sportif', categorie: 'Loisirs' },
    { id: 8, type: 'Établissement scolaire', categorie: 'Éducation' }
  ]);
  
  const [communes, setCommunes] = useState([
    { id: 1, nom: 'Dakar', region: 'Dakar' },
    { id: 2, nom: 'Pikine', region: 'Dakar' },
    { id: 3, nom: 'Guédiawaye', region: 'Dakar' },
    { id: 4, nom: 'Rufisque', region: 'Dakar' }
  ]);
  
  const [activeTab, setActiveTab] = useState('localisation');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Essayer de charger les données depuis l'API si disponible
  useEffect(() => {
    if (show) {
      chargerDonneesAPI();
    }
  }, [show]);

  const chargerDonneesAPI = async () => {
    try {
      console.log('🔄 Tentative de chargement des données depuis API...');
      
      // Charger les communes depuis API
      try {
        const reponseCommunes = await fetch(`${API_BASE_URL}/communes`);
        if (reponseCommunes.ok) {
          const data = await reponseCommunes.json();
          if (data.success && data.data && data.data.length > 0) {
            console.log('✅ Communes chargées depuis API:', data.data.length);
            setCommunes(data.data);
            // Mettre à jour la commune sélectionnée si nécessaire
            setFormData(prev => ({
              ...prev,
              commune_id: data.data[0].id.toString()
            }));
          }
        }
      } catch (error) {
        console.log('ℹ️ Utilisation des communes par défaut');
      }

      // Charger les types depuis API
      try {
        const reponseTypes = await fetch(`${API_BASE_URL}/types-ressources`);
        if (reponseTypes.ok) {
          const data = await reponseTypes.json();
          if (data.success && data.data && data.data.length > 0) {
            console.log('✅ Types chargés depuis API:', data.data.length);
            setTypesRessources(data.data);
          }
        }
      } catch (error) {
        console.log('ℹ️ Utilisation des types par défaut');
      }

    } catch (error) {
      console.log('ℹ️ Utilisation des données par défaut');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setMessage('');

    try {
      // Validation des données
      if (!formData.nom.trim()) {
        setMessage('❌ Le nom de la ressource est obligatoire');
        setIsSubmitting(false);
        return;
      }

      if (!formData.type_ressource_id) {
        setMessage('❌ Le type de ressource est obligatoire');
        setIsSubmitting(false);
        return;
      }

      if (!formData.commune_id) {
        setMessage('❌ La commune est obligatoire');
        setIsSubmitting(false);
        return;
      }

      // Validation des coordonnées
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        setMessage('❌ Coordonnées GPS invalides');
        setIsSubmitting(false);
        return;
      }

      // Préparer les données pour l'API
      const donneesSoumission = {
        nom: formData.nom.trim(),
        type_ressource_id: parseInt(formData.type_ressource_id),
        description: formData.description,
        latitude: lat,
        longitude: lng,
        commune_id: parseInt(formData.commune_id),
        potentiel: formData.potentiel,
        etat_utilisation: formData.etat_utilisation,
        contact_nom: formData.contact_nom,
        contact_tel: formData.contact_tel
      };

      console.log('📤 Envoi des données:', donneesSoumission);

      // Récupérer le token
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('❌ Vous devez être connecté pour ajouter une ressource');
        setIsSubmitting(false);
        return;
      }

      // Appel API
      const response = await fetch(`${API_BASE_URL}/ressources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donneesSoumission)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage('✅ Ressource ajoutée avec succès !');
        
        // Appeler le callback de succès
        if (onRessourceAdded) {
          onRessourceAdded(result.data);
        }

        // Fermer le formulaire après un délai
        setTimeout(() => {
          onHide();
          setMessage('');
          setIsSubmitting(false);
          
          // Reset du formulaire mais garder la commune
          setFormData({
            nom: '',
            type_ressource_id: '',
            description: '',
            potentiel: 'faible',
            etat_utilisation: 'inexploité',
            contact_nom: '',
            contact_tel: '',
            latitude: positionInitiale?.lat?.toString() || '14.764504',
            longitude: positionInitiale?.lng?.toString() || '-17.366029',
            commune_id: formData.commune_id
          });
          setActiveTab('localisation');
        }, 2000);

      } else {
        throw new Error(result.error || `Erreur ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Erreur:', error);
      setMessage(`❌ Erreur: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const handlePositionChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    
    if (onPositionChange) {
      onPositionChange({ lat, lng });
    }
  };

  const handleGetCurrentMapPosition = () => {
    if (onPositionChange) {
      onPositionChange('getCurrent');
    }
  };

  // Calculer si le formulaire est valide
  const isFormValid = formData.nom.trim() && 
                     formData.type_ressource_id && 
                     formData.commune_id && 
                     formData.latitude && 
                     formData.longitude;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <div className="flutter-card" style={{ 
        margin: 0, 
        border: 'none', 
        borderRadius: 'var(--radius-xl)',
        ...modalStyles.modalContent,
        position: 'relative'
      }}>

        {/* Overlay de chargement */}
        {isSubmitting && (
          <div style={modalStyles.loadingOverlay}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p style={{ marginTop: '10px', fontSize: '14px' }}>Ajout en cours...</p>
            </div>
          </div>
        )}

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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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

                {/* CHAMP COMMUNE */}
                <div style={modalStyles.formField}>
                  <label style={modalStyles.label}>
                    Commune *
                  </label>
                  <select
                    name="commune_id"
                    value={formData.commune_id}
                    onChange={handleChange}
                    className="flutter-input"
                    style={{ fontSize: '14px' }}
                    disabled={isSubmitting}
                  >
                    {communes.map(commune => (
                      <option key={commune.id} value={commune.id}>
                        {commune.nom} {commune.region ? `- ${commune.region}` : ''}
                      </option>
                    ))}
                  </select>
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    ← Retour
                  </button>
                  <button 
                    type="button"
                    className="flutter-btn primary"
                    onClick={() => setActiveTab('informations')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    style={{ fontSize: '14px' }}
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    ← Localisation
                  </button>
                  <button 
                    type="button"
                    className="flutter-btn primary"
                    onClick={() => setActiveTab('contacts')}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    <div><strong>Commune :</strong> {communes.find(c => c.id == formData.commune_id)?.nom || 'Non sélectionnée'}</div>
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
                    disabled={isSubmitting}
                  >
                    ← Informations
                  </button>
                  <button 
                    type="submit"
                    className="flutter-btn primary"
                    style={{ 
                      fontSize: '14px', 
                      padding: '10px 20px',
                      opacity: isFormValid ? 1 : 0.6,
                      cursor: isFormValid ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Ajout...
                      </>
                    ) : (
                      '💾 Enregistrer la Ressource'
                    )}
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