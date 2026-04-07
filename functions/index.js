/**
 * PRD § Security: when a user account is deleted, remove sensitive Firestore data.
 * Deploy: `firebase deploy --only functions` after `firebase init functions`.
 *
 * const { onUserDeleted } = require("firebase-functions/v2/identity");
 * exports.cleanupUserData = onUserDeleted(async (event) => {
 *   const uid = event.data.uid;
 *   // await admin.firestore().recursiveDelete(... users/{uid} ...);
 * });
 */

const functions = require("firebase-functions");

exports.health = functions.https.onRequest((_req, res) => {
  res.json({ ok: true, note: "Replace with onUserDeleted cleanup per PRD" });
});
