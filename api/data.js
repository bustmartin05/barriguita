const { getFirestore, requireAdmin } = require('./firebase-admin');

const PUBLIC_READ_COLLECTIONS = new Set([
  'barriguitas_prices',
  'barriguitas_shipping_zones',
  'barriguitas_upsell_offers',
  'barriguitas_promos',
  'barriguitas_reviews',
  'barriguitas_gallery'
]);

const PUBLIC_WRITE_COLLECTIONS = new Set(['barriguitas_reviews', 'barriguitas_orders']);
const ADMIN_COLLECTIONS = new Set([
  ...PUBLIC_READ_COLLECTIONS,
  'barriguitas_orders'
]);

function send(res, status, body) {
  res.status(status).json(body);
}

function normalizeDocument(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

module.exports = async function handler(req, res) {
  const collection = String(req.query.collection || '');
  const operation = req.method === 'GET' ? 'read' : req.method === 'POST' ? 'write' : '';

  if (!ADMIN_COLLECTIONS.has(collection) || !operation) {
    return send(res, 404, { error: 'Colección u operación no disponible.' });
  }

  try {
    const isPublicRead = req.method === 'GET' && PUBLIC_READ_COLLECTIONS.has(collection);
    const isPublicWrite = req.method === 'POST' && PUBLIC_WRITE_COLLECTIONS.has(collection);
    if (!isPublicRead && !isPublicWrite) {
      await requireAdmin(req);
    }

    const db = getFirestore();
    const reference = db.collection(collection);

    if (req.method === 'GET') {
      const snapshot = await reference.get();
      return send(res, 200, { data: snapshot.docs.map(normalizeDocument) });
    }

    const action = req.body && req.body.action;
    const records = Array.isArray(req.body && req.body.records) ? req.body.records : [];

    if (isPublicWrite && collection === 'barriguitas_reviews') {
      if (records.length !== 1 || !records[0].name || !records[0].text) {
        return send(res, 400, { error: 'La reseña requiere nombre y texto.' });
      }
      records[0].rating = Math.min(5, Math.max(1, Number(records[0].rating) || 5));
      records[0].date_text = 'Hoy';
    }

    if (action === 'delete') {
      if (records.length !== 1 || !records[0].id) {
        return send(res, 400, { error: 'Se requiere un único id para borrar.' });
      }
      await reference.doc(String(records[0].id)).delete();
      return send(res, 200, { data: [] });
    }

    if (records.length === 0) {
      return send(res, 400, { error: 'No hay registros para guardar.' });
    }

    const batch = db.batch();
    records.forEach((record) => {
      const { id, ...data } = record;
      const document = id ? reference.doc(String(id)) : reference.doc();
      batch.set(document, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    });
    await batch.commit();
    return send(res, 200, { data: [] });
  } catch (error) {
    console.error('Firebase data API error:', error);
    return send(res, error.statusCode || 500, { error: error.message || 'Error interno.' });
  }
};
