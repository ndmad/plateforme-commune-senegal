const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, email, password, role, commune_id, telephone } = req.body;

    // Validation
    if (!nom || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nom, email et mot de passe requis'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.query(
      'SELECT id FROM utilisateurs WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const query = `
      INSERT INTO utilisateurs (nom, email, password_hash, role, commune_id, telephone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nom, email, role, commune_id, telephone, created_at
    `;
    
    const result = await db.query(query, [
      nom, 
      email, 
      password_hash, 
      role || 'editeur', 
      commune_id, 
      telephone
    ]);

    // Générer le token JWT
    const token = jwt.sign(
      { userId: result.rows[0].id },
      process.env.JWT_SECRET || 'votre_secret_par_defaut',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: result.rows[0],
        token
      },
      message: 'Utilisateur créé avec succès'
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur
    const result = await db.query(
      `SELECT id, nom, email, password_hash, role, commune_id, telephone, actif 
       FROM utilisateurs WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    const user = result.rows[0];

    // Vérifier si le compte est actif
    if (!user.actif) {
      return res.status(401).json({
        success: false,
        error: 'Compte désactivé'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'votre_secret_par_defaut',
      { expiresIn: '7d' }
    );

    // Retourner les données utilisateur (sans le mot de passe)
    const userData = {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      commune_id: user.commune_id,
      telephone: user.telephone
    };

    res.json({
      success: true,
      data: {
        user: userData,
        token
      },
      message: 'Connexion réussie'
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de connexion'
    });
  }
});

// Profil utilisateur (protégé)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

module.exports = router;