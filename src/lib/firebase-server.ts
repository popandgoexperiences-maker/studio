import admin from 'firebase-admin';

// Esta variable de marca evita la reinicialización en entornos de "recarga rápida" de desarrollo.
let isFirebaseAdminInitialized = false;

function initializeFirebaseAdmin() {
  if (isFirebaseAdminInitialized) {
    return;
  }

  // Comprueba si ya hay una app inicializada (puede ocurrir en algunos entornos).
  if (admin.apps.length > 0) {
    console.log("Firebase Admin: ya inicializado, reusando instancia.");
    isFirebaseAdminInitialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      console.log("Firebase Admin: inicializando...");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin inicializado — projectId=', projectId, 'privateKeyPresent=', Boolean(privateKey));
      isFirebaseAdminInitialized = true;
    } catch (e: any) {
      console.error("Error al inicializar Firebase Admin SDK:", e.stack);
      // No marcamos como inicializado si falla
    }
  } else {
    // Lanzar un error si faltan las variables de entorno es más claro que un warning silencioso.
    const missingVars = [
        !projectId && "FIREBASE_PROJECT_ID",
        !clientEmail && "FIREBASE_CLIENT_EMAIL",
        !privateKey && "FIREBASE_PRIVATE_KEY"
    ].filter(Boolean).join(", ");
    
    throw new Error(`Faltan variables de entorno de Firebase Admin: ${missingVars}. No se puede inicializar el SDK.`);
  }
}

// Llama a la inicialización al cargar el módulo para asegurar que esté lista.
initializeFirebaseAdmin();

/**
 * Obtiene la instancia de Firestore de forma segura.
 * Garantiza que el SDK de Admin esté inicializado antes de devolverla.
 * @returns Instancia de Firestore.
 */
export const getFirestoreSafe = (): FirebaseFirestore.Firestore => {
  if (!isFirebaseAdminInitialized) {
    // Intenta reinicializar si falló la primera vez, como último recurso.
    initializeFirebaseAdmin();
    if (!isFirebaseAdminInitialized) {
        throw new Error("El SDK de Firebase Admin no está inicializado. Comprueba las credenciales y los logs del servidor.");
    }
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
    initializeFirebaseAdmin();
    if (!isFirebaseAdminInitialized) {
        throw new Error("El SDK de Firebase Admin no está inicializado. Comprueba las credenciales y los logs del servidor.");
    }
  }
  return admin.auth();
};
