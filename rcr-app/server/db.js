const { Firestore, FieldValue } = require('@google-cloud/firestore');

// On Cloud Run, Firestore authenticates automatically via the service's runtime
// service account (Application Default Credentials) — no key file needed.
// For local development, set GOOGLE_APPLICATION_CREDENTIALS to a key file,
// or run the Firestore emulator and set FIRESTORE_EMULATOR_HOST.
const firestore = new Firestore({
  databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
});

const COLLECTION = 'requests';
const collection = firestore.collection(COLLECTION);

// Fields that make up an RCR request document (mirrors the old SQL schema)
const FIELDS = [
  'topic', 'checklist_data', 'plant', 'unit', 'line_no', 'piping_class', 'rcr_standard', 'drawing_no',
  'material', 'p_no', 'thickness', 'rating', 'production', 'services',
  'nde_rt', 'nde_ut', 'nde_mpi', 'nde_dpi', 'nde_ht', 'nde_pmi',
  'pwht', 'pwht_comment', 'design_temp', 'design_pressure', 'test_pressure',
  'insulation', 'coating_method', 'paint_code', 'wps_document',
  'repair_method', 'inspection_engineer', 'date',
];

// Keep only known fields, defaulting missing ones to null so documents stay consistent
function pickFields(data) {
  const out = {};
  for (const f of FIELDS) out[f] = data[f] !== undefined ? data[f] : null;
  return out;
}

// Convert a Firestore document into a plain object with `id` and ISO-string timestamps
function docToObject(doc) {
  const data = doc.data();
  const toIso = (v) => (v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v);
  return {
    id: doc.id,
    ...data,
    created_at: toIso(data.created_at),
    updated_at: toIso(data.updated_at),
  };
}

async function getAllRequests() {
  const snap = await collection.orderBy('created_at', 'desc').get();
  return snap.docs.map(docToObject);
}

async function getRequest(id) {
  const doc = await collection.doc(id).get();
  return doc.exists ? docToObject(doc) : null;
}

async function createRequest(data) {
  const ref = await collection.add({
    ...pickFields(data),
    status: 'Pending',
    approver_name: null,
    approved_date: null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

async function updateRequest(id, data) {
  const ref = collection.doc(id);
  if (!(await ref.get()).exists) return { updated: 0 };
  await ref.update({
    ...pickFields(data),
    updated_at: FieldValue.serverTimestamp(),
  });
  return { updated: 1 };
}

async function approveRequest(id, approver_name, approved_date) {
  const ref = collection.doc(id);
  if (!(await ref.get()).exists) return { updated: 0 };
  await ref.update({
    status: 'Approved',
    approver_name,
    approved_date,
    updated_at: FieldValue.serverTimestamp(),
  });
  return { updated: 1 };
}

async function deleteRequest(id) {
  const ref = collection.doc(id);
  if (!(await ref.get()).exists) return { deleted: 0 };
  await ref.delete();
  return { deleted: 1 };
}

console.log('Using Firestore database:', process.env.FIRESTORE_DATABASE_ID || '(default)');

module.exports = {
  getAllRequests,
  getRequest,
  createRequest,
  updateRequest,
  approveRequest,
  deleteRequest,
};
