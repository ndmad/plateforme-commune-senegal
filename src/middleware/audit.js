const db = require('../config/database');

console.log('✅ [AUDIT] Middleware chargé et actif');

const auditMiddleware = (req, res, next) => {
  console.log('🔍 [AUDIT] Middleware déclenché -', req.method, req.originalUrl);

  // Sauvegarder la méthode originale
  const originalSend = res.send;

  res.send = function (data) {
    console.log('🔍 [AUDIT] Réponse envoyée -', req.method, req.originalUrl, 'Status:', res.statusCode);

    // Utiliser req.originalUrl au lieu de req.path
    if (shouldAudit(req.method, req.originalUrl)) {
      console.log('🔍 [AUDIT] Déclenché pour:', req.method, req.originalUrl);

      // Utiliser un setTimeout pour éviter de bloquer la réponse
      setTimeout(async () => {
        try {
          await auditAction(req, data);
          console.log('✅ [AUDIT] Action auditée avec succès');
        } catch (error) {
          console.error('❌ [AUDIT] Erreur:', error.message);
        }
      }, 0);
    } else {
      console.log('🔍 [AUDIT] Non déclenché - Pas dans la liste des paths audités');
    }

    // Appeler la méthode originale
    originalSend.call(this, data);
  };

  next();
};

const shouldAudit = (method, originalUrl) => {
  // Auditer TOUTES les méthodes sur les chemins importants
  const auditedPaths = [
    '/api/ressources',
    '/api/communes',
    '/api/utilisateurs',
    '/api/admin',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/statistiques'
  ];

  const shouldAudit = auditedPaths.some(p => originalUrl.startsWith(p));

  console.log('🔍 [AUDIT] Check:', {
    method,
    originalUrl,
    shouldAudit
  });

  return shouldAudit;
};

const auditAction = async (req, responseData) => {
  try {
    console.log('🔍 [AUDIT] Début auditAction pour:', req.method, req.originalUrl);

    let action = 'READ';
    let tableName = getTableName(req.originalUrl); // Utiliser originalUrl ici aussi
    let recordId = extractRecordId(req, responseData);

    // Déterminer l'action basée sur la méthode HTTP
    switch (req.method) {
      case 'POST':
        action = 'CREATE';
        break;
      case 'PUT':
        action = 'UPDATE';
        break;
      case 'DELETE':
        action = 'DELETE';
        break;
      case 'GET':
        if (req.originalUrl.includes('/login')) action = 'LOGIN';
        else if (req.originalUrl.includes('/logout')) action = 'LOGOUT';
        else action = 'VIEW';
        break;
      default:
        action = req.method;
    }

    // Préparer les données pour l'audit
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.nom : 'Système';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

    console.log('🔍 [AUDIT] Données:', {
      tableName: tableName || 'unknown', // ← CORRECTION ICI
      recordId: recordId || 'N/A',
      action,
      userId: userId || 'system',
      userName: userName || 'Unknown',
      ipAddress
    });

    // Insérer dans la table d'audit
    if (tableName) {
      const result = await db.query(
        `INSERT INTO audit_logs 
         (table_name, record_id, action, old_values, new_values, user_id, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          tableName,
          recordId,
          action,
          null, // old_values
          JSON.stringify(sanitizeData(req.body)), // new_values
          userId,
          ipAddress,
          req.get('User-Agent') || 'Unknown'
        ]
      );

      console.log('✅ [AUDIT] Enregistrement créé - ID:', result.rows[0].id);
      console.log(`📝 [AUDIT] ${action} sur ${tableName}${recordId ? '#' + recordId : ''} par ${userName}`);

    } else {
      console.log('🔍 [AUDIT] Table name non trouvée - Audit ignoré');
    }

  } catch (error) {
    console.error('❌ [AUDIT] Erreur détaillée:', error);
  }
};

// Modifier getTableName pour utiliser originalUrl
const getTableName = (originalUrl) => {
  if (originalUrl.includes('/ressources')) return 'ressources';
  if (originalUrl.includes('/communes')) return 'communes';
  if (originalUrl.includes('/utilisateurs') || originalUrl.includes('/admin/utilisateurs')) return 'utilisateurs';
  if (originalUrl.includes('/auth/login') || originalUrl.includes('/auth/logout')) return 'auth';
  if (originalUrl.includes('/statistiques')) return 'statistiques';

  console.log('🔍 [AUDIT] Table non mappée pour originalUrl:', originalUrl);
  return 'unknown';
};

// ... (le reste des fonctions extractRecordId et sanitizeData reste inchangé)

const extractRecordId = (req, responseData) => {
  // 1. Essayer depuis les paramètres de route
  if (req.params.id) {
    console.log('🔍 [AUDIT] Record ID from params:', req.params.id);
    return req.params.id;
  }

  // 2. Essayer depuis le body (pour les créations)
  if (req.body && req.body.id) {
    console.log('🔍 [AUDIT] Record ID from body:', req.body.id);
    return req.body.id;
  }

  // 3. Essayer depuis la réponse (pour les créations)
  try {
    if (responseData) {
      const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
      const idFromResponse = data?.data?.id || data?.id;
      if (idFromResponse) {
        console.log('🔍 [AUDIT] Record ID from response:', idFromResponse);
        return idFromResponse;
      }
    }
  } catch (parseError) {
    console.log('🔍 [AUDIT] Parse response error:', parseError.message);
  }

  // 4. Extraire de l'URL (ex: /api/ressources/123 → 123)
  const match = req.path.match(/\/(\d+)$/);
  if (match) {
    console.log('🔍 [AUDIT] Record ID from URL match:', match[1]);
    return match[1];
  }

  console.log('🔍 [AUDIT] Aucun Record ID trouvé');
  return null;
};

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;

  // Créer une copie pour ne pas modifier l'original
  const sanitized = { ...data };

  // Masquer les données sensibles
  const sensitiveFields = ['password', 'token', 'mot_de_passe', 'secret', 'api_key'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });

  return sanitized;
};

module.exports = { auditMiddleware };