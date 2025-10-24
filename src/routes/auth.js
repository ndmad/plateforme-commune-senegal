const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Route de connexion simple (pour l'instant)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Pour l'instant, une vérification basique
    const result = await db.query('SELECT * FROM utilisateurs WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // En production, vous utiliserez bcrypt pour les mots de passe
    const user = result.rows[0];
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        commune_id: user.commune_id
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de connexion'
    });
  }
});

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, email, password, role, commune_id, telephone } = req.body;
    
    const query = `
      INSERT INTO utilisateurs (nom, email, password_hash, role, commune_id, telephone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nom, email, role, commune_id, telephone
    `;
    
    const result = await db.query(query, [nom, email, password, role, commune_id, telephone]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Utilisateur créé avec succès'
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

module.exports = router;