import admin from "firebase-admin";

let init = false;

function ensureAdmin() {
  if (init) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
  } else {
    console.warn(
      "[auth] Firebase Admin not configured — /api/* will return 503"
    );
  }
  init = true;
}

function hasFirebaseApp() {
  return admin.apps?.length > 0;
}

/**
 * Express middleware: verifies `Authorization: Bearer <ID token>`.
 * Attaches `req.user` with decoded token fields.
 */
export async function verifyFirebaseToken(req, res, next) {
  ensureAdmin();
  if (!hasFirebaseApp()) {
    return res.status(503).json({ error: "Auth service unavailable" });
  }
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
