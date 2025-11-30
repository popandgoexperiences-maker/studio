import { getFirestoreSafe } from "./firebase-server";
import type { User, Invoice, Client } from '@/lib/definitions';

// --- DATA FETCHING (SERVER-SIDE) ---
export async function fetchClients(userId: string): Promise<Client[]> {
  const db = getFirestoreSafe();
  const clientsCol = db.collection('users').doc(userId).collection('clients');
  const snapshot = await clientsCol.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client));
}

export async function fetchInvoices(userId: string): Promise<Invoice[]> {
  const db = getFirestoreSafe();
  const invoicesCol = db.collection('users').doc(userId).collection('invoices');
  const q = invoicesCol.where('userId', '==', userId).orderBy('date', 'desc');
  const snapshot = await q.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice));
}

export async function fetchUser(userId: string): Promise<User | null> {
  const db = getFirestoreSafe();
  const userDocRef = db.collection('users').doc(userId);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
}

export async function fetchNextInvoiceNumber(userId: string): Promise<string> {
  const db = getFirestoreSafe();
  const invoicesCol = db.collection('users').doc(userId).collection('invoices');
  const q = invoicesCol.where('userId', '==', userId).orderBy('invoiceNumber', 'desc').limit(1);
  const snapshot = await q.get();

  if (snapshot.empty) {
    return 'F-001';
  }

  const lastInvoiceNumber = snapshot.docs[0].data().invoiceNumber;
  const lastNumber = parseInt(lastInvoiceNumber.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `F-${String(nextNumber).padStart(3, '0')}`;
}

// --- DATA SAVING (SERVER-SIDE) ---
export async function saveInvoice(userId: string, invoiceData: Omit<Invoice, 'id'>) {
  const db = getFirestoreSafe();
  const invoicesCol = db.collection('users').doc(userId).collection('invoices');
  await invoicesCol.add(invoiceData);
}

export async function saveClient(userId: string, clientData: Omit<Client, 'id'>) {
  const db = getFirestoreSafe();
  const clientsCol = db.collection('users').doc(userId).collection('clients');
  await clientsCol.add(clientData);
}

export async function updateUserProfile(userId: string, data: any) {
  console.log("---- DIAGNÓSTICO updateUserProfile ----");
  console.log("User ID recibido:", userId);
  console.log("Datos recibidos:", data);

  try {
    const db = getFirestoreSafe();
    console.log("Instancia Firestore obtenida.");

    const ref = db.collection('users').doc(userId);
    console.log("Referencia del documento:", ref.path);

    await ref.set(data, { merge: true });

    console.log("🔥 Perfil guardado correctamente.");
    return { ok: true };
  } catch (err: any) {
    console.error("❌ ERROR updateUserProfile:", err.message);
    console.error("STACK:", err.stack);
    // Relanzar el error para que la Server Action lo capture.
    throw new Error(`Error en updateUserProfile: ${err.message}`);
  }
}

export async function createUserProfile(userId: string, user: User) {
  const db = getFirestoreSafe();
  const userDocRef = db.collection('users').doc(userId);
  await userDocRef.set(user, { merge: true });
}
