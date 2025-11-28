import {
  doc,
  collection,
  getDocs,
  setDoc,
  addDoc,
  query,
  limit,
  orderBy,
  getDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseAuth } from './firebase-server';
import type { User, Invoice, Client } from '@/lib/definitions';

// --- DATA FETCHING (SERVER-SIDE) ---
export async function fetchClients(userId: string): Promise<Client[]> {
  const { firestore } = await getFirebaseAuth();
  const clientsCol = collection(firestore, 'users', userId, 'clients');
  const snapshot = await getDocs(clientsCol);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client));
}

export async function fetchInvoices(userId: string): Promise<Invoice[]> {
  const { firestore } = await getFirebaseAuth();
  const invoicesCol = collection(firestore, 'users', userId, 'invoices');
  const q = query(invoicesCol, where('userId', '==', userId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice));
}

export async function fetchUser(userId: string): Promise<User | null> {
  const { firestore } = await getFirebaseAuth();
  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
}

export async function fetchNextInvoiceNumber(userId: string): Promise<string> {
  const { firestore } = await getFirebaseAuth();
  const invoicesCol = collection(firestore, 'users', userId, 'invoices');
  const q = query(invoicesCol, where('userId', '==', userId), orderBy('invoiceNumber', 'desc'), limit(1));
  const snapshot = await getDocs(q);

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
  const { firestore } = await getFirebaseAuth();
  const invoicesCol = collection(firestore, 'users', userId, 'invoices');
  await addDoc(invoicesCol, invoiceData);
}

export async function saveClient(userId: string, clientData: Omit<Client, 'id'>) {
  const { firestore } = await getFirebaseAuth();
  const clientsCol = collection(firestore, 'users', userId, 'clients');
  await addDoc(clientsCol, clientData);
}

export async function updateUserProfile(userId: string, userData: Partial<User>) {
  const { firestore } = await getFirebaseAuth();
  const userDocRef = doc(firestore, 'users', userId);
  await setDoc(userDocRef, userData, { merge: true });
}

export async function createUserProfile(userId: string, user: User) {
  const { firestore } = await getFirebaseAuth();
  const userDocRef = doc(firestore, 'users', userId);
  await setDoc(userDocRef, user, { merge: true });
}
