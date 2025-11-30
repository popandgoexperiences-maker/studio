import admin from "firebase-admin";

if (!admin.apps.length) {
  console.log("Inicializando Firebase Admin (diagnóstico)...");
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} else {
  console.log("Firebase Admin ya estaba inicializado.");
}

export const getFirestoreSafe = () => {
  try {
    const db = admin.firestore();
    console.log("Firestore obtenido correctamente.");
    return db;
  } catch (err) {
    console.error("🔥 Error al obtener Firestore:", err);
    throw err;
  }
};

export const getAuthSafe = () => {
  try {
    return admin.auth();
  } catch (err) {
    console.error("🔥 Error al obtener Auth:", err);
    throw err;
  }
};
