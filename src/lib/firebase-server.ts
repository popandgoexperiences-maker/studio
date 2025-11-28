
import { initializeApp, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

// This file is intended for server-side use ONLY.

let firebaseApp: App;
let auth: Auth;
let firestore: Firestore;

try {
    // If the app is already initialized, use it.
    firebaseApp = getApp();
} catch (e) {
    // Otherwise, initialize the app using Application Default Credentials.
    // This is the recommended approach for server-side environments like Cloud Run.
    console.log("Initializing Firebase Admin SDK...");
    firebaseApp = initializeApp();
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
