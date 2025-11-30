import admin from 'firebase-admin';

// Esta variable de marca evita la reinicialización en entornos de "recarga rápida" de desarrollo.
let isFirebaseAdminInitialized = false;

function initializeFirebaseAdmin() {
  if (isFirebaseAdminInitialized) {
    return;
  }

  // Comprueba si ya hay una app inicializada (puede ocurrir en algunos entornos).
  if (admin.apps.length > 0) {
    isFirebaseAdminInitialized = true;
    return;
  }

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
      console.log("Firebase Admin SDK inicializado correctamente.");
      isFirebaseAdminInitialized = true;
    } catch (e: any) {
      console.error("Error al inicializar Firebase Admin SDK:", e.stack);
    }
  } else {
    console.warn("Las variables de entorno de Firebase Admin no están completamente configuradas. Saltando inicialización.");
  }
}

// Llama a la inicialización al cargar el módulo.
initializeFirebaseAdmin();

/**
 * Obtiene la instancia de Firestore de forma segura.
 * Garantiza que el SDK de Admin esté inicializado antes de devolverla.
 * @returns Instancia de Firestore.
 */
export const getFirestoreSafe = (): FirebaseFirestore.Firestore => {
  if (!isFirebaseAdminInitialized) {
    throw new Error("Firebase Admin SDK no se ha inicializado. Las credenciales pueden faltar.");
  }
  return admin.firestore();
};

/**
 * Obtiene la instancia de Auth de forma segura.
 * Garantiza que el SDK de Admin esté inicializado antes de devolverla.
 * @returns Instancia de Auth.
 */
export const getAuthSafe = (): admin.auth.Auth => {
  if (!isFirebaseAdminInitialized) {
    throw new Error("Firebase Admin SDK no se ha inicializado. Las credenciales pueden faltar.");
  }
  return admin.auth();
};
