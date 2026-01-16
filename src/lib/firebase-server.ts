import admin from 'firebase-admin';

/**
 * Garantiza que Firebase Admin SDK se inicialice una sola vez de forma perezosa y segura.
 * Este patrón es ideal para entornos sin servidor (serverless) y con recarga en caliente (hot-reloading).
 * @returns La instancia de la aplicación Firebase Admin inicializada.
 */
function getAdminApp() {
  // Si ya hay una aplicación inicializada, la reutilizamos para evitar errores.
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  // Obtenemos las credenciales de las variables de entorno.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // IMPORTANTE: La clave privada de las variables de entorno necesita que los \n se conviertan en saltos de línea reales.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Verificamos que todas las credenciales necesarias estén presentes.
  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [
        !projectId && "FIREBASE_PROJECT_ID",
        !clientEmail && "FIREBASE_CLIENT_EMAIL",
        !privateKey && "FIREBASE_PRIVATE_KEY"
    ].filter(Boolean).join(", ");
    
    // Este error es crítico y detendrá el proceso, lo cual es intencional
    // para proporcionar un feedback claro sobre lo que falta.
    throw new Error(`Faltan variables de entorno de Firebase Admin: ${missingVars}. No se puede inicializar el SDK.`);
  }

  // Intentamos inicializar la aplicación con las credenciales.
  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase Admin SDK inicializado con éxito.');
    return app;
  } catch (error: any) {
    // Registramos el error detallado y lanzamos uno más genérico.
    console.error('Error catastrófico al inicializar Firebase Admin SDK:', error.stack);
    throw new Error(`No se pudo inicializar Firebase Admin SDK: ${error.message}`);
  }
}

/**
 * Obtiene la instancia del servicio de autenticación, asegurando que la app esté inicializada.
 * @returns La instancia del servicio Firebase Auth.
 */
export const getAuthSafe = () => {
  const app = getAdminApp();
  return admin.auth(app);
};

/**
 * Obtiene la instancia del servicio de Firestore, asegurando que la app esté inicializada.
 * @returns La instancia del servicio Firebase Firestore.
 */
export const getFirestoreSafe = () => {
  const app = getAdminApp();
  return admin.firestore(app);
};

// Exportamos adminAuth para mantener la compatibilidad con otros archivos que puedan usar este nombre.
export const adminAuth = getAuthSafe;
