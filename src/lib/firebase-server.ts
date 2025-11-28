'use server';

import { initializeApp, getApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

// This file is intended for server-side use ONLY.

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // This error is thrown when the service account key is not set in the environment variables.
  // It's a critical error because the server-side Firebase services cannot be initialized without it.
  // We throw an error here to prevent the application from running in a broken state.
  // The error message is intended to be informative for the developer to fix the configuration.
  console.error(
    'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Please add it to your .env file.'
  );
}

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : {};

// Initialize Firebase once and export the instances.
let firebaseApp: App;
if (!getApps().length) {
  firebaseApp = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  firebaseApp = getApp();
}

export const auth: Auth = getAuth(firebaseApp);
export const firestore: Firestore = getFirestore(firebaseApp);

export async function deleteUserSession() {
  const sessionCookieName = '__session';
  const sessionCookie = cookies().get(sessionCookieName);

  if (sessionCookie) {
    cookies().set(sessionCookieName, '', { maxAge: -1 }); // Expire the cookie
  }
}
