'use server';

import admin from "firebase-admin";

// This file is intended for server-side use ONLY.

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // This error is thrown when the service account key is not set in the environment variables.
  // We throw an error here to prevent the application from running in a broken state.
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Please add it to your .env file.');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });
}

export const adminAuth = admin.auth();
export const firestore = admin.firestore();
