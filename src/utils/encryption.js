const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  
    // Vérifier que la clé existe
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 characters long');
    }
    this.key = Buffer.from(key, 'utf8');
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        data: encrypted,
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Erreur chiffrement:', error);
      throw new Error('Erreur lors du chiffrement des données');
    }
  }

  decrypt(encryptedData) {
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.key);
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Erreur déchiffrement:', error);
      throw new Error('Erreur lors du déchiffrement des données');
    }
  }

  // Hash pour les données sensibles (comme les emails)
  hashData(data) {
    return crypto
      .createHash('sha256')
      .update(data + (process.env.HASH_SALT || 'votre_salt_secret'))
      .digest('hex');
  }
}

module.exports = new EncryptionService();