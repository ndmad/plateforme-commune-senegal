import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import MiniCarteLocalisation from './MiniCarteLocalisation'; // Ajustez le chemin si nécessaire

// AJOUTEZ CE STYLE EN HAUT DU FICHIER
const formFieldStyle = {
  marginBottom: '20px'
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: '600',
  color: 'var(--on-surface)',
  fontSize: '14px'
};

function FormulaireRessource({ show, onHide }) {
  // États et logique du composant
  const [formData, setFormData] = useState({
    nom: '',
    type_ressource_id: '',
    description: '',
    potentiel: 'faible',
    etat_utilisation: 'inexploité',
    contact_nom: '',
    contact_tel: '',
    latitude: '14.764504',
    longitude: '-17.366029'
  });

  const [message, setMessage] = useState('');
  const [typesRessources, setTypesRessources] = useState([]);

  // Exemple de fonctions de gestion (à adapter)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logique de soumission ici
    console.log('Données soumises:', formData);
  };

  // Chargement des types de ressources (exemple)
  useEffect(() => {
    // Simuler le chargement des types
    setTypesRessources([
      { id: 1, type: 'Terrain agricole', categorie: 'Agricole' },
      { id: 2, type: 'Bâtiment', categorie: 'Immobilier' },
      // Ajoutez d'autres types selon vos besoins
    ]);
  }, []);

  // PUIS MODIFIEZ LE RETURN PRINCIPAL :
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <div className="flutter-card" style={{ margin: 0, border: 'none', borderRadius: 'var(--radius-xl)' }}>
        <Modal.Header closeButton style={{ 
          borderBottom: '1px solid #f1f5f9',
          padding: '24px 24px 16px'
        }}>
          <Modal.Title style={{ 
            fontSize: '20px', 
            fontWeight: '700',
            color: 'var(--on-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ➕ Ajouter une Nouvelle Ressource
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '24px' }}>
            {message && (
              <div className={`flutter-fade-in ${message.includes('✅') ? 'alert-success' : 'alert-error'}`} style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                fontSize: '14px',
                background: message.includes('✅') ? 'var(--primary-50)' : '#fef2f2',
                color: message.includes('✅') ? 'var(--primary-700)' : '#dc2626',
                border: `1px solid ${message.includes('✅') ? 'var(--primary-200)' : '#fecaca'}`
              }}>
                {message}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={formFieldStyle}>
                <label style={labelStyle}>
                  Nom de la ressource *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Ex: Marché central, Zone agricole..."
                  required
                  className="flutter-input"
                />
              </div>

              <div style={formFieldStyle}>
                <label style={labelStyle}>
                  Type de ressource *
                </label>
                <select
                  name="type_ressource_id"
                  value={formData.type_ressource_id}
                  onChange={handleChange}
                  required
                  className="flutter-input"
                  style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"%23666\" d=\"M2 0L0 2h4zm0 5L0 3h4z\"/></svg>")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '8px 10px' }}
                >
                  <option value="">Sélectionnez un type</option>
                  {typesRessources.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.type} ({type.categorie})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={formFieldStyle}>
              <label style={labelStyle}>
                Description
              </label>
              <textarea
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez la ressource, son état, son potentiel..."
                className="flutter-input"
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={formFieldStyle}>
                <label style={labelStyle}>
                  Potentiel de valorisation
                </label>
                <select
                  name="potentiel"
                  value={formData.potentiel}
                  onChange={handleChange}
                  className="flutter-input"
                >
                  <option value="faible">Faible</option>
                  <option value="moyen">Moyen</option>
                  <option value="élevé">Élevé</option>
                </select>
              </div>

              <div style={formFieldStyle}>
                <label style={labelStyle}>
                  État d'utilisation
                </label>
                <select
                  name="etat_utilisation"
                  value={formData.etat_utilisation}
                  onChange={handleChange}
                  className="flutter-input"
                >
                  <option value="inexploité">Inexploité</option>
                  <option value="sous-utilisé">Sous-utilisé</option>
                  <option value="optimisé">Optimisé</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={formFieldStyle}>
                <label style={labelStyle}>
                  Contact (nom)
                </label>
                <input
                  type="text"
                  name="contact_nom"
                  value={formData.contact_nom}
                  onChange={handleChange}
                  placeholder="Personne à contacter"
                  className="flutter-input"
                />
              </div>

              <div style={formFieldStyle}>
                <label style={labelStyle}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="contact_tel"
                  value={formData.contact_tel}
                  onChange={handleChange}
                  placeholder="77 123 45 67"
                  className="flutter-input"
                />
              </div>
            </div>

            <div style={formFieldStyle}>
              <label style={labelStyle}>
                Localisation sur la carte *
              </label>
              <MiniCarteLocalisation
                latitude={formData.latitude}
                longitude={formData.longitude}
                onPositionChange={(lat, lng) => {
                  setFormData({
                    ...formData,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6)
                  });
                }}
              />
              <div style={{ marginTop: '8px' }}>
                <small style={{ color: 'var(--on-background)' }}>
                  📍 Cliquez sur la carte pour positionner précisément la ressource
                  <br />
                  Coordonnées: {formData.latitude}, {formData.longitude}
                </small>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer style={{ 
            borderTop: '1px solid #f1f5f9',
            padding: '16px 24px 24px'
          }}>
            <button 
              type="button"
              className="flutter-btn secondary"
              onClick={onHide}
              style={{ fontSize: '14px' }}
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="flutter-btn primary"
              style={{ fontSize: '14px' }}
            >
              💾 Enregistrer la Ressource
            </button>
          </Modal.Footer>
        </Form>
      </div>
    </Modal>
  );
}

export default FormulaireRessource;