
import admin from "firebase-admin";

// This file is intended for server-side use ONLY.

// The initialization logic is now handled in `next.config.ts` to ensure it runs only once.
// This file now simply exports the already-initialized services.

if (!admin.apps.length) {
  console.error("Firebase Admin SDK not initialized. Please check your next.config.ts file.");
  // In a real scenario, you might want to throw an error or have a more robust fallback.
} else {
  console.log("Firebase Admin SDK already initialized, re-using existing instance.");
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
