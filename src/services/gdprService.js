// Dans gdprService.js
const db = require('../config/database');

class GDPRService {
  async anonymizeUserData(userId) {
    try {
      await db.query(
        `UPDATE utilisateurs 
         SET nom = 'Utilisateur Anonyme', 
             email = CONCAT('anon_', id, '@example.com'),
             telephone = NULL,
             commune_id = NULL,
             actif = false
         WHERE id = $1`,
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Erreur anonymisation:', error);
      throw error;
    }
  }

  async exportUserData(userId) {
    const userResult = await db.query(
      'SELECT id, nom, email, role, commune_id, created_at FROM utilisateurs WHERE id = $1',
      [userId]
    );
    
    const ressourcesResult = await db.query(
      'SELECT * FROM ressources WHERE created_by = $1',
      [userId]
    );

    return {
      utilisateur: userResult.rows[0],
      ressources: ressourcesResult.rows,
      exportDate: new Date().toISOString()
    };
  }

  async deleteUserData(userId) {
    // D'abord anonymiser
    await this.anonymizeUserData(userId);
    
    // Puis supprimer les données personnelles
    await db.query(
      'DELETE FROM audit_logs WHERE user_id = $1',
      [userId]
    );
    
    return true;
  }
}