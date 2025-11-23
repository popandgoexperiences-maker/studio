'use client';

import {
  getFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  limit,
  orderBy,
} from 'firebase/firestore';
import { getAuth }s from 'firebase/auth';

import {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';

import type { User, Invoice, Client } from '@/lib/definitions';
import { initializeFirebase } from '@/firebase/index';

const { firestore, auth } = initializeFirebase();

// Helper to get the current user's UID
const getUserId = () => {
  if (!auth.currentUser) {
    throw new Error('User is not authenticated.');
  }
  return auth.currentUser.uid;
};

// --- DATA FETCHING ---

export async function fetchClients(): Promise<Client[]> {
  const userId = getUserId();
  const clientsCol = collection(firestore, 'users', userId, 'clients');
  const snapshot = await getDocs(clientsCol);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client));
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const userId = getUserId();
  const invoicesCol = collection(firestore, 'users', userId, 'invoices');
  const q = query(invoicesCol, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice));
}

export async function fetchUser(): Promise<User> {
  const userId = getUserId();
  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await (await getDocs(query(collection(firestore, 'users'), where('id', '==', userId)))).docs[0];

  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  // This should not happen if user is authenticated and profile exists
  throw new Error('User profile not found.');
}

export async function fetchNextInvoiceNumber(): Promise<string> {
  const userId = getUserId();
  const invoicesCol = collection(firestore, 'users', userId, 'invoices');
  const q = query(invoicesCol, orderBy('invoiceNumber', 'desc'), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return 'F-001';
  }

  const lastInvoiceNumber = snapshot.docs[0].data().invoiceNumber;
  const lastNumber = parseInt(lastInvoiceNumber.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `F-${String(nextNumber).padStart(3, '0')}`;
}

// --- DATA SAVING (NON-BLOCKING) ---

export function saveInvoice(invoiceData: Omit<Invoice, 'id'>) {
  const userId = getUserId();
  const invoicesCol = collection(firestore, 'users', userId, 'invoices');
  // Use non-blocking add
  addDocumentNonBlocking(invoicesCol, invoiceData);
}

export function saveClient(clientData: Omit<Client, 'id'>) {
    const userId = getUserId();
    const clientsCol = collection(firestore, 'users', userId, 'clients');
    // Use non-blocking add
    addDocumentNonBlocking(clientsCol, clientData);
}

export function updateUserProfile(userData: Partial<User>) {
  const userId = getUserId();
  const userDocRef = doc(firestore, 'users', userId);
  // Use non-blocking update/set
  setDocumentNonBlocking(userDocRef, userData, { merge: true });
}

export function createUserProfile(user: User) {
    const userDocRef = doc(firestore, 'users', user.id);
    setDocumentNonBlocking(userDocRef, user, { merge: true });
}