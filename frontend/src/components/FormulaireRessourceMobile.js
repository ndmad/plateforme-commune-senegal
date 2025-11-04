// components/FormulaireRessourceMobile.js
import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { API_BASE_URL } from '../config';

// STYLES OPTIMISÉS POUR MOBILE
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
    padding: '16px',
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
  positionInfo: {
    padding: '12px',
    background: 'var(--primary-50)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    color: 'var(--primary-700)',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid var(--primary-200)'
  }
};

function FormulaireRessourceMobile({ show, onHide, positionInitiale, onRessourceAdded }) {
  const [formData, setFormData] = useState({
    nom: '',
    type_ressource_id: '',
    description: '',
    potentiel: 'faible',
    etat_utilisation: 'inexploité',
    contact_nom: '',
    contact_tel: '',
    latitude: positionInitiale?.lat?.toString() || '',
    longitude: positionInitiale?.lng?.toString() || '',
    commune_id: '' // CHAMP OBLIGATOIRE
  });

  const [message, setMessage] = useState('');
  const [typesRessources, setTypesRessources] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les types de ressources et les communes
  useEffect(() => {
    chargerTypesRessources();
    chargerCommunes();
  }, []);

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

  const chargerTypesRessources = async () => {
    try {
      // Pour l'instant, on garde les données mockées
      setTypesRessources([
        { id: 1, type: 'Terrain agricole', categorie: 'Agricole' },
        { id: 2, type: 'Bâtiment public', categorie: 'Immobilier' },
        { id: 3, type: 'Site touristique', categorie: 'Tourisme' },
        { id: 4, type: 'Commerce', categorie: 'Économique' },
        { id: 5, type: 'Ressource naturelle', categorie: 'Environnement' },
      ]);
    } catch (error) {
      console.error('Erreur chargement types ressources:', error);
    }
  };

  const chargerCommunes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/communes`);
      const data = await response.json();
      
      if (data.success) {
        setCommunes(data.data || []);
        console.log('✅ Communes chargées:', data.data.length);
        
        // Sélectionner automatiquement la première commune par défaut
        if (data.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            commune_id: data.data[0].id.toString()
          }));
        }
      } else {
        console.error('Erreur API communes:', data.error);
        // Fallback avec des communes par défaut
        setCommunes([
          { id: 1, nom: 'Commune A' },
          { id: 2, nom: 'Commune B' },
          { id: 3, nom: 'Commune C' }
        ]);
        setFormData(prev => ({
          ...prev,
          commune_id: '1'
        }));
      }
    } catch (error) {
      console.error('Erreur chargement communes:', error);
      // Fallback avec des communes par défaut
      setCommunes([
        { id: 1, nom: 'Commune A' },
        { id: 2, nom: 'Commune B' },
        { id: 3, nom: 'Commune C' }
      ]);
      setFormData(prev => ({
        ...prev,
        commune_id: '1'
      }));
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
      // Validation des données requises
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

      if (!formData.latitude || !formData.longitude) {
        setMessage('❌ Position non définie');
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

      console.log('📤 Données soumises mobile:', donneesSoumission);

      // RÉEL APPEL API
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${API_BASE_URL}/ressources`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donneesSoumission)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Erreur ${response.status}`);
      }

      console.log('✅ Résultat API:', result);
      setMessage('✅ Ressource ajoutée avec succès !');
      
      // Appeler le callback de succès avec les vraies données
      if (onRessourceAdded) {
        onRessourceAdded(result.data);
      }

      // Fermer le formulaire après un délai
      setTimeout(() => {
        onHide();
        setMessage('');
        setIsSubmitting(false);
        
        // Reset du formulaire mais garder la commune sélectionnée
        setFormData({
          nom: '',
          type_ressource_id: '',
          description: '',
          potentiel: 'faible',
          etat_utilisation: 'inexploité',
          contact_nom: '',
          contact_tel: '',
          latitude: positionInitiale?.lat?.toString() || '',
          longitude: positionInitiale?.lng?.toString() || '',
          commune_id: formData.commune_id // Garder la même commune
        });
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout:', error);
      setMessage(`❌ Erreur: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  // Calculer si le bouton doit être désactivé
  const isFormValid = formData.nom.trim() && 
                     formData.type_ressource_id && 
                     formData.commune_id && 
                     formData.latitude && 
                     formData.longitude &&
                     !isSubmitting;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered fullscreen="sm-down">
      <div className="flutter-card" style={{ 
        margin: 0, 
        border: 'none', 
        borderRadius: 'var(--radius-xl)',
        ...modalStyles.modalContent
      }}>
        <Modal.Header closeButton style={{ 
          borderBottom: '1px solid #f1f5f9',
          padding: '16px 16px 12px',
          flexShrink: 0
        }}>
          <Modal.Title style={{ 
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--on-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ➕ Ajouter une Ressource
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body style={modalStyles.modalBody}>
            
            {message && (
              <div style={{
                padding: '10px 16px',
                background: message.includes('✅') ? 'var(--primary-50)' : '#fef2f2',
                color: message.includes('✅') ? 'var(--primary-700)' : '#dc2626',
                border: `1px solid ${message.includes('✅') ? 'var(--primary-200)' : '#fecaca'}`,
                marginBottom: '16px',
                fontSize: '12px',
                borderRadius: 'var(--radius-md)'
              }}>
                {message}
              </div>
            )}

            {/* AFFICHAGE DE LA POSITION (lecture seule) */}
            {formData.latitude && formData.longitude && (
              <div style={modalStyles.positionInfo}>
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>📍</div>
                <strong>Position sélectionnée sur la carte</strong><br />
                <small>Lat: {formData.latitude} | Lng: {formData.longitude}</small>
              </div>
            )}

            {/* CHAMP NOM */}
            <div style={modalStyles.formField}>
              <label style={modalStyles.label}>
                Nom de la ressource *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: Marché central, Zone maraîchère..."
                required
                className="flutter-input"
                style={{ fontSize: '14px' }}
                disabled={isSubmitting}
              />
            </div>

            {/* CHAMP TYPE */}
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

            {/* CHAMP COMMUNE */}
            <div style={modalStyles.formField}>
              <label style={modalStyles.label}>
                Commune *
              </label>
              <select
                name="commune_id"
                value={formData.commune_id}
                onChange={handleChange}
                required
                className="flutter-input"
                style={{ fontSize: '14px' }}
                disabled={isSubmitting}
              >
                <option value="">Sélectionnez une commune</option>
                {communes.map(commune => (
                  <option key={commune.id} value={commune.id}>
                    {commune.nom}
                  </option>
                ))}
              </select>
              {communes.length === 0 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  ⏳ Chargement des communes...
                </div>
              )}
            </div>

            {/* CHAMP DESCRIPTION */}
            <div style={modalStyles.formField}>
              <label style={modalStyles.label}>
                Description détaillée
              </label>
              <textarea
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez la ressource : état, caractéristiques, historique..."
                className="flutter-input"
                style={{ 
                  resize: 'vertical', 
                  minHeight: '80px',
                  fontSize: '14px'
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* POTENTIEL ET ÉTAT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={modalStyles.formField}>
                <label style={modalStyles.label}>
                  Potentiel
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
                  État
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

            {/* CONTACTS */}
            <div style={{ 
              padding: '16px', 
              background: 'var(--surface)', 
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              border: '1px solid var(--outline)'
            }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--on-surface)' }}>👥 Informations de contact</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={modalStyles.formField}>
                  <label style={{...modalStyles.label, fontSize: '12px'}}>
                    Nom du contact
                  </label>
                  <input
                    type="text"
                    name="contact_nom"
                    value={formData.contact_nom}
                    onChange={handleChange}
                    placeholder="Ex: M. Diop..."
                    className="flutter-input"
                    style={{ fontSize: '13px' }}
                    disabled={isSubmitting}
                  />
                </div>

                <div style={modalStyles.formField}>
                  <label style={{...modalStyles.label, fontSize: '12px'}}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="contact_tel"
                    value={formData.contact_tel}
                    onChange={handleChange}
                    placeholder="77 123 45 67"
                    className="flutter-input"
                    style={{ fontSize: '13px' }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* BOUTON VALIDATION */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginTop: '8px'
            }}>
              <button 
                type="button"
                className="flutter-btn secondary"
                onClick={onHide}
                style={{ fontSize: '14px', padding: '12px 16px', flex: 1 }}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="flutter-btn primary"
                style={{ 
                  fontSize: '14px', 
                  padding: '12px 16px', 
                  flex: 2,
                  opacity: isFormValid ? 1 : 0.6,
                  cursor: isFormValid ? 'pointer' : 'not-allowed'
                }}
                disabled={!isFormValid}
              >
                {isSubmitting ? '⏳ Enregistrement...' : '💾 Enregistrer la Ressource'}
              </button>
            </div>

            {/* DEBUG - Afficher l'état du formulaire */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ 
                marginTop: '10px', 
                padding: '8px', 
                background: '#f5f5f5', 
                borderRadius: '4px', 
                fontSize: '10px',
                color: '#666'
              }}>
                <strong>Debug:</strong> nom: {formData.nom ? '✓' : '✗'}, 
                type: {formData.type_ressource_id ? '✓' : '✗'}, 
                commune: {formData.commune_id ? '✓' : '✗'}, 
                lat/lng: {formData.latitude && formData.longitude ? '✓' : '✗'}
              </div>
            )}
          </Modal.Body>
        </Form>
      </div>
    </Modal>
  );
}

export default FormulaireRessourceMobile;