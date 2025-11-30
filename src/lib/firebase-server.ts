
import admin from "firebase-admin";

// This file is intended for server-side use ONLY.

// The initialization logic is now handled in `next.config.ts` to ensure it runs only once.
// This file now simply exports the already-initialized services.

if (!admin.apps.length) {
  console.log("Firebase Admin SDK not initialized. Initializing now...");
  // This initialization should ideally happen only once per server process.
  // The check in next.config.ts is the primary one, this is a fallback.
   const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully in firebase-server.ts.");
    } catch (e: any) {
        console.error("Firebase Admin SDK initialization error in firebase-server.ts:", e.stack);
    }
  } else {
      console.warn("Firebase Admin environment variables are not fully set in firebase-server.ts. Skipping initialization.");
  }
} else {
  console.log("Firebase Admin SDK already initialized, re-using existing instance.");
}

export const adminAuth = () => admin.auth();
export const firestore = () => admin.firestore();

// --- Bloque de depuración para asegurar que el documento de prueba existe ---
(async () => {
  if (admin.apps.length) {
    const testUserDocRef = firestore().doc('users/test-uid');
    try {
      const docSnap = await testUserDocRef.get();
      if (docSnap.exists) {
        // console.log('Setup de prueba: El documento /users/test-uid ya existe.');
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
