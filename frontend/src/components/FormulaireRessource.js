import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
// Ajoutez cet import en haut du fichier
import MiniCarteLocalisation from './MiniCarteLocalisation';


const FormulaireRessource = ({ show, onHide, onRessourceAdded }) => {
    const [formData, setFormData] = useState({
        nom: '',
        type_ressource_id: '',
        description: '',
        potentiel: 'moyen',
        etat_utilisation: 'sous-utilisé',
        contact_nom: '',
        contact_tel: '',
        latitude: 14.7167,
        longitude: -17.4677
    });

    const [showCarte, setShowCarte] = useState(false);
    const [message, setMessage] = useState('');

    // Types de ressources disponibles
    const typesRessources = [
        { id: 1, type: 'Agricole', categorie: 'Naturelle' },
        { id: 2, type: 'Hydrique', categorie: 'Naturelle' },
        { id: 3, type: 'Commerciale', categorie: 'Economique' },
        { id: 4, type: 'Artisanale', categorie: 'Economique' },
        { id: 5, type: 'Touristique', categorie: 'Naturelle' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/ressources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    commune_id: 1 // Pour l'instant, commune fixe
                })
            });

            const result = await response.json();

            if (result.success) {
                setMessage('✅ Ressource ajoutée avec succès!');
                setFormData({
                    nom: '',
                    type_ressource_id: '',
                    description: '',
                    potentiel: 'moyen',
                    etat_utilisation: 'sous-utilisé',
                    contact_nom: '',
                    contact_tel: '',
                    latitude: 14.7167,
                    longitude: -17.4677
                });

                // Appeler le callback pour actualiser la liste
                if (onRessourceAdded) {
                    onRessourceAdded();
                }

                // Fermer le modal après 2 secondes
                setTimeout(() => {
                    onHide();
                    setMessage('');
                }, 2000);
            } else {
                setMessage('❌ Erreur: ' + result.error);
            }
        } catch (error) {
            setMessage('❌ Erreur de connexion au serveur');
            console.error('Erreur:', error);
        }
    };

    const handleCarteClick = (e) => {
        // Simuler un clic sur la carte pour récupérer les coordonnées
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Conversion approximative en coordonnées géographiques
        const lat = 14.7167 + (y / rect.height - 0.5) * 0.1;
        const lng = -17.4677 + (x / rect.width - 0.5) * 0.1;

        setFormData({
            ...formData,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
        });
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>➕ Ajouter une Nouvelle Ressource</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {message && (
                        <Alert variant={message.includes('✅') ? 'success' : 'danger'}>
                            {message}
                        </Alert>
                    )}

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nom de la ressource *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    placeholder="Ex: Marché central, Zone agricole..."
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Type de ressource *</Form.Label>
                                <Form.Select
                                    name="type_ressource_id"
                                    value={formData.type_ressource_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Sélectionnez un type</option>
                                    {typesRessources.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.type} ({type.categorie})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Décrivez la ressource, son état, son potentiel..."
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Potentiel de valorisation</Form.Label>
                                <Form.Select
                                    name="potentiel"
                                    value={formData.potentiel}
                                    onChange={handleChange}
                                >
                                    <option value="faible">Faible</option>
                                    <option value="moyen">Moyen</option>
                                    <option value="élevé">Élevé</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>État d'utilisation</Form.Label>
                                <Form.Select
                                    name="etat_utilisation"
                                    value={formData.etat_utilisation}
                                    onChange={handleChange}
                                >
                                    <option value="inexploité">Inexploité</option>
                                    <option value="sous-utilisé">Sous-utilisé</option>
                                    <option value="optimisé">Optimisé</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Contact (nom)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="contact_nom"
                                    value={formData.contact_nom}
                                    onChange={handleChange}
                                    placeholder="Personne à contacter"
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Téléphone</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="contact_tel"
                                    value={formData.contact_tel}
                                    onChange={handleChange}
                                    placeholder="77 123 45 67"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Localisation sur la carte *</Form.Label>
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
                        <Form.Text className="text-muted">
                            📍 Cliquez sur la carte pour positionner précisément la ressource
                            <br />
                            Coordonnées: {formData.latitude}, {formData.longitude}
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Annuler
                    </Button>
                    <Button variant="primary" type="submit">
                        💾 Enregistrer la Ressource
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default FormulaireRessource;