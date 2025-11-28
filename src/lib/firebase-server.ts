import { initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

// This file is intended for server-side use ONLY.

const firebaseAdminConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

let firebaseApp: App;
let auth: Auth;
let firestore: Firestore;

try {
    // Try to get an already-initialized app.
    firebaseApp = getApp();
} catch (e) {
    // If no app is initialized, create one.
    const { projectId, clientEmail, privateKey } = firebaseAdminConfig;

    // Check if all required service account credentials are provided.
    if (projectId && clientEmail && privateKey) {
        firebaseApp = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                // Replace escaped newlines from environment variable.
                privateKey: privateKey.replace(/\\n/g, '\n'),
            })
        });
    } else {
        // Fallback for environments where the SDK can auto-discover credentials (like Google Cloud Run).
        console.warn("Firebase Admin SDK config missing or incomplete. Using default application credentials.");
        firebaseApp = initializeApp();
    }
}

auth = getAuth(firebaseApp);
firestore = getFirestore(firebaseApp);

export function getFirebaseAuth() {
  return { firebaseApp, auth, firestore };
}

export async function deleteUserSession() {
  const sessionCookieName = '__session';
  const sessionCookie = cookies().get(sessionCookieName);

  if (sessionCookie) {
    cookies().set(sessionCookieName, '', { maxAge: -1 }); // Expire the cookie
  }
}
