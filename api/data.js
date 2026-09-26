const { getFirestore, requireAdmin } = require('./firebase-admin');

const PUBLIC_READ_COLLECTIONS = new Set([
  'barriguitas_prices',
  'barriguitas_shipping_zones',
  'barriguitas_store_settings',
  'barriguitas_upsell_offers',
  'barriguitas_promos',
  'barriguitas_reviews',
  'barriguitas_gallery',
  'barriguitas_fillings'
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

const INITIAL_FILLINGS = [
  ['without_cold_chain', 'Dulce de leche'],
  ['without_cold_chain', 'Dulce de leche con nueces'],
  ['without_cold_chain', 'Dulce de leche con chispas de chocolate'],
  ['without_cold_chain', 'Dulce de leche con merengue'],
  ['without_cold_chain', 'Crema bariloche'],
  ['without_cold_chain', 'Crema oreo'],
  ['without_cold_chain', 'Crema chocotorta'],
  ['without_cold_chain', 'Crema pastelera'],
  ['without_cold_chain', 'Ganache de chocolate'],
  ['without_cold_chain', 'Crema con pulpa de frutilla'],
  ['without_cold_chain', 'Crema con pulpa de durazno'],
  ['without_cold_chain', 'Marroc de chocolate blanco'],
  ['without_cold_chain', 'Marroc de chocolate con leche'],
  ['without_cold_chain', 'Crema Nutella'],
  ['without_cold_chain', 'Buttercream de frutos rojos'],
  ['without_cold_chain', 'Banana split'],
  ['requires_cold_chain', 'Crema con Frutilla'],
  ['requires_cold_chain', 'Crema con durazno'],
  ['requires_cold_chain', 'Crema de limón'],
  ['requires_cold_chain', 'Crema Chantilly'],
  ['requires_cold_chain', 'Crema moka'],
  ['requires_cold_chain', 'Limón cocado'],
  ['requires_cold_chain', 'Mousse de chocolate'],
  ['requires_cold_chain', 'Mousse de frutilla']
];

async function ensureInitialFillings(collection) {
  const seedMarker = collection.firestore.collection('barriguitas_metadata').doc('fillings-seed-v1');
  const seedState = await seedMarker.get();
  if (seedState.exists) return;

  const existing = await collection.limit(1).get();
  const batch = collection.firestore.batch();
  if (existing.empty) {
    INITIAL_FILLINGS.forEach(([category, name], index) => {
      const categoryPrefix = category === 'requires_cold_chain' ? 'frio' : 'sin-frio';
      const document = collection.doc(`${categoryPrefix}-${String(index + 1).padStart(2, '0')}`);
      batch.set(document, { name, category, active: true, sortOrder: index });
    });
  }
  batch.set(seedMarker, { initialized: true });
  await batch.commit();
}

module.exports = async function handler(req, res) {
  const collection = String(req.query.collection || '');
  const operation = req.method === 'GET' ? 'read' : req.method === 'POST' ? 'write' : '';

  if (!ADMIN_COLLECTIONS.has(collection) || !operation) {
    return send(res, 404, { error: 'Colección u operación no disponible.' });
  }

  try {
    const hasAdminToken = String(req.headers.authorization || '').startsWith('Bearer ');
    const isPublicRead = req.method === 'GET'
      && PUBLIC_READ_COLLECTIONS.has(collection)
      && !(collection === 'barriguitas_fillings' && hasAdminToken);
    const isPublicWrite = req.method === 'POST' && PUBLIC_WRITE_COLLECTIONS.has(collection);
    if (!isPublicRead && !isPublicWrite) {
      await requireAdmin(req);
    }

    const db = getFirestore();
    const reference = db.collection(collection);

    if (req.method === 'GET') {
      if (collection === 'barriguitas_fillings') {
        await ensureInitialFillings(reference);
      }
      const snapshot = await reference.get();
      const records = snapshot.docs.map(normalizeDocument);
      const data = isPublicRead && collection === 'barriguitas_fillings'
        ? records.filter((record) => record.active === true)
        : records;
      return send(res, 200, { data });
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
    if (collection === 'barriguitas_store_settings' && records.some((record) => (
      record.id !== 'delivery'
      || typeof record.enabled !== 'boolean'
    ))) {
      return send(res, 400, { error: 'La configuración de entrega requiere un estado habilitado válido.' });
    }
    if (collection === 'barriguitas_promos' && records.some((record) => (
      record.image_url !== undefined
      && (typeof record.image_url !== 'string' || record.image_url.length > 950 * 1024)
    ))) {
      return send(res, 400, { error: 'La imagen de la promoción supera el tamaño permitido.' });
    }
    if (collection === 'barriguitas_fillings' && records.some((record) => (
      typeof record.name !== 'string'
      || !record.name.trim()
      || !['without_cold_chain', 'requires_cold_chain'].includes(record.category)
      || typeof record.active !== 'boolean'
    ))) {
      return send(res, 400, { error: 'Cada relleno requiere nombre, categoría y estado válido.' });
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
