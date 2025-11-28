import { initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

// This file is intended for server-side use ONLY.

const firebaseAdminConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let firebaseApp: App;
let auth: Auth;
let firestore: Firestore;

try {
    firebaseApp = getApp();
} catch (e) {
    if (firebaseAdminConfig.projectId && firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
        firebaseApp = initializeApp({
            credential: cert(firebaseAdminConfig)
        });
    } else {
        console.warn("Firebase Admin SDK config missing. Using default credentials.");
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
