const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);
    
    return new Promise((resolve, reject) => {
      // Commande PostgreSQL pour le dump
      const command = `pg_dump -h localhost -U postgres -d plateforme_commune -f ${backupFile}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Erreur sauvegarde:', error);
          reject(error);
          return;
        }
        
        console.log(`✅ Sauvegarde créée: ${backupFile}`);
        
        // Nettoyer les vieilles sauvegardes (garder 7 jours)
        this.cleanOldBackups();
        
        resolve(backupFile);
      });
    });
  }

  cleanOldBackups() {
    const files = fs.readdirSync(this.backupDir);
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > sevenDays) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Sauvegarde supprimée: ${file}`);
      }
    });
  }

  // Planification automatique (à appeler par un cron job)
  scheduleBackups() {
    // Sauvegarde tous les jours à 2h du matin
    setInterval(() => {
      this.createBackup().catch(console.error);
    }, 24 * 60 * 60 * 1000);
  }

  // Sauvegarde des fichiers uploadés
  async backupUploads() {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const backupDir = path.join(this.backupDir, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) return;

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copie récursive des fichiers
    this.copyRecursive(uploadsDir, backupDir);
  }

  copyRecursive(src, dest) {
    if (fs.statSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      
      fs.readdirSync(src).forEach(child => {
        this.copyRecursive(
          path.join(src, child),
          path.join(dest, child)
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

module.exports = new BackupService();