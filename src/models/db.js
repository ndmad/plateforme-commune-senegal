const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'plateforme_commune_sn',
  password: process.env.DB_PASSWORD || 'votre_mot_de_passe',
  port: process.env.DB_PORT || 5432,
});

// Test de connexion
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.stack);
  } else {
    console.log('✅ Connecté à la base de données PostgreSQL');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};