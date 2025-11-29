
import admin from "firebase-admin";

// This file is intended for server-side use ONLY.

console.log("--- Depuración de Firebase Admin ---");
console.log("ID del Proyecto (FIREBASE_PROJECT_ID):", process.env.FIREBASE_PROJECT_ID ? 'Cargado' : 'No encontrado');
console.log("Email del Cliente (FIREBASE_CLIENT_EMAIL):", process.env.FIREBASE_CLIENT_EMAIL ? 'Cargado' : 'No encontrado');
console.log("Clave Privada (FIREBASE_PRIVATE_KEY):", process.env.FIREBASE_PRIVATE_KEY ? 'Cargada' : 'No encontrada');
console.log("------------------------------------");

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('Firebase server environment variables are not set. Please add them to your .env file.');
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key must have its newlines escaped as \n to be parsed correctly.
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin inicializado correctamente");
}

export const adminAuth = admin.auth();
export const firestore = admin.firestore();
