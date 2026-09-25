module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }
  res.status(200).json({ projectId: process.env.FIREBASE_PROJECT_ID || '' });
};
