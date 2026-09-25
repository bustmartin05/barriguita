const admin = require('firebase-admin');

function getFirebaseApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin no está configurado. Revisa las variables de entorno.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n')
    })
  });
}

function getFirestore() {
  return getFirebaseApp() && admin.firestore();
}

async function requireAdmin(req) {
  getFirebaseApp();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    const error = new Error('Autenticación requerida.');
    error.statusCode = 401;
    throw error;
  }

  const decoded = await admin.auth().verifyIdToken(token);
  if (decoded.admin !== true) {
    const error = new Error('No tienes permisos de administrador.');
    error.statusCode = 403;
    throw error;
  }

  return decoded;
}

module.exports = { getFirestore, requireAdmin };
