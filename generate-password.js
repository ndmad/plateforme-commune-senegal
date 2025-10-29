const bcrypt = require('bcryptjs');

// CHANGEZ LE MOT DE PASSE ICI SI VOUS VOULEZ
const password = 'admin123';  // ← Vous pouvez modifier

// Générer le hash
const hashedPassword = bcrypt.hashSync(password, 10);

console.log('=====================');
console.log('🔐 NOUVEAU MOT DE PASSE ADMIN');
console.log('=====================');
console.log('Mot de passe en clair:', password);
console.log('Hash à copier:', hashedPassword);
console.log('=====================');
console.log('📋 Instructions:');
console.log('1. Copiez le HASH ci-dessus');
console.log('2. Exécutez la commande SQL dans PostgreSQL');
console.log('3. Connectez-vous avec le mot de passe en clair');
