import * as admin from 'firebase-admin';

export function getAdminAuth() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    // Handle newlines in private key securely
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      console.warn('Firebase Admin credentials not found. Authentication verification will fail.');
      admin.initializeApp(); // Initialize empty to prevent throw, will fail gracefully on usage
    }
  }
  return admin.auth();
}
