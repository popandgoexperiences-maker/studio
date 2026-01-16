import admin from 'firebase-admin';

/**
 * Garantiza que Firebase Admin SDK se inicialice una sola vez de forma segura.
 * Reutiliza la instancia si ya existe (importante para entornos de desarrollo con recarga en caliente).
 * Lanza un error si faltan las credenciales para un diagnóstico claro.
 */
function initializeFirebaseAdmin() {
  // Si ya hay una aplicación inicializada, la reutilizamos.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Obtiene las credenciales de las variables de entorno.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Importante: reemplaza los caracteres de nueva línea escapados.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Si falta alguna credencial, lanza un error claro.
  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [
        !projectId && "FIREBASE_PROJECT_ID",
        !clientEmail && "FIREBASE_CLIENT_EMAIL",
        !privateKey && "FIREBASE_PRIVATE_KEY"
    ].filter(Boolean).join(", ");
    
    throw new Error(`Faltan variables de entorno de Firebase Admin: ${missingVars}. No se puede inicializar el SDK.`);
  }

  // Intenta inicializar la aplicación.
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
    console.error('Error al inicializar Firebase Admin SDK:', error.stack);
    // Relanza el error para que el servidor falle al arrancar si no puede inicializar.
    throw new Error('No se pudo inicializar Firebase Admin SDK.');
  }
}

// Llama a la inicialización al cargar el módulo y guarda la instancia.
const adminApp = initializeFirebaseAdmin();

/**
 * Obtiene la instancia de Firestore de forma segura.
 * @returns Instancia de Firestore.
 */
export const getFirestoreSafe = () => admin.firestore(adminApp);

/**
 * Obtiene la instancia de Auth de forma segura.
 * @returns Instancia de Auth.
 */
export const getAuthSafe = () => admin.auth(adminApp);