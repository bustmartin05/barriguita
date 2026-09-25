const https = require('https');

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (response) => {
      let result = '';
      response.on('data', (chunk) => { result += chunk; });
      response.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(result);
        } catch {
          reject(new Error('Respuesta inválida del proveedor de autenticación.'));
          return;
        }
        resolve({ status: response.statusCode, body: parsed });
      });
    });
    request.on('error', reject);
    request.write(JSON.stringify(body));
    request.end();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const email = String(req.body && req.body.email || '').trim();
  const password = String(req.body && req.body.password || '');
  if (!apiKey || !email || !password) {
    res.status(400).json({ error: 'Credenciales incompletas.' });
    return;
  }

  try {
    const result = await postJson(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      { email, password, returnSecureToken: true }
    );
    if (result.status !== 200) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }
    res.status(200).json({ idToken: result.body.idToken, refreshToken: result.body.refreshToken });
  } catch (error) {
    console.error('Firebase auth API error:', error);
    res.status(502).json({ error: 'No fue posible validar las credenciales.' });
  }
};
