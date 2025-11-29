
import admin from "firebase-admin";

// This file is intended for server-side use ONLY.

console.log("--- Depuración de Firebase Admin ---");
console.log("ID del Proyecto (FIREBASE_PROJECT_ID):", process.env.FIREBASE_PROJECT_ID ? 'Cargado' : 'No encontrado');
console.log("Email del Cliente (FIREBASE_CLIENT_EMAIL):", process.env.FIREBASE_CLIENT_EMAIL ? 'Cargado' : 'No encontrado');

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
console.log(
  "Clave Privada (FIREBASE_PRIVATE_KEY):",
  privateKey
    ? `Cargada (termina en ...${privateKey.slice(-4)})`
    : "No encontrada"
);

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

// --- Bloque de depuración para asegurar que el documento de prueba existe ---
(async () => {
  if (admin.apps.length) {
    const testUserDocRef = firestore.doc('users/test-uid');
    try {
      const docSnap = await testUserDocRef.get();
      if (docSnap.exists) {
        console.log('Setup de prueba: El documento /users/test-uid ya existe.');
      } else {
        console.log('Setup de prueba: Creando documento /users/test-uid...');
        await testUserDocRef.set({
          id: 'test-uid',
          name: 'Usuario de Prueba',
          email: 'test@example.com',
          nif: 'B00000000',
          address: 'Calle Falsa 123',
          phone: '600123456',
          vatRate: 0.21,
        });
        console.log('Setup de prueba: Documento /users/test-uid creado con éxito.');
      }
    } catch (error) {
      console.error('Error al verificar/crear el documento de prueba:', error);
    }
  }
})();


// --- Bloque de depuración de token ---
(async () => {
  if (admin.apps.length) { // Solo ejecutar si admin está inicializado
    try {
      await adminAuth.createCustomToken("test-uid");
      console.log("Token de prueba creado correctamente.");
    } catch (error) {
      console.error("Error creando token de prueba:", error);
    }
  }
})();
