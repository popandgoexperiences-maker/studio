import {
  getFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  addDoc,
  query,
  limit,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { getFirebaseAuth } from './firebase-server';
import type { User, Invoice, Client } from '@/lib/definitions';

// Helper to get the current user's UID safely on the server
const getUserId = async () => {
    const { auth } = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) {
      // This part might need to be more robust, e.g., by checking session state
      // For now, it relies on the server-side auth state which might not be immediately available
      // after client-side sign-in without a page refresh or re-authentication.
      return new Promise<string>((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
          unsubscribe();
          if (user) {
            resolve(user.uid);
          } else {
            reject(new Error('User is not authenticated.'));
          }
        });
      });
    }
    return user.uid;
};

// --- DATA FETCHING (SERVER-SIDE) ---
export async function fetchClients(): Promise<Client[]> {
  const userId = await getUserId();
  const { firestore } = getFirebaseAuth();
  const clientsCol = collection(firestore, 'users', userId, 'clients');
  const snapshot = await getDocs(clientsCol);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client));
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const userId = await getUserId();
  const { firestore } = getFirebaseAuth();
  const invoicesCol = collection(firestore, 'users', userId, 'invoices');
  const q = query(invoicesCol, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice));
}

export async function fetchUser(): Promise<User> {
  const userId = await getUserId();
  const { firestore } = getFirebaseAuth();
  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  throw new Error('User profile not found.');
}

export async function fetchNextInvoiceNumber(): Promise<string> {
  const userId = await getUserId();
  const { firestore } = getFirebaseAuth();
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

// --- DATA SAVING (SERVER-SIDE) ---
export async function saveInvoice(invoiceData: Omit<Invoice, 'id'>) {
  const userId = await getUserId();
  const { firestore } = getFirebaseAuth();
  const invoicesCol = collection(firestore, 'users', userId, 'invoices');
  await addDoc(invoicesCol, invoiceData);
}

export async function saveClient(clientData: Omit<Client, 'id'>) {
  const userId = await getUserId();
  const { firestore } = getFirebaseAuth();
  const clientsCol = collection(firestore, 'users', userId, 'clients');
  await addDoc(clientsCol, clientData);
}

export async function updateUserProfile(userData: Partial<User>) {
  const userId = await getUserId();
  const { firestore } = getFirebaseAuth();
  const userDocRef = doc(firestore, 'users', userId);
  await setDoc(userDocRef, userData, { merge: true });
}

export async function createUserProfile(user: User) {
  const { firestore } = getFirebaseAuth();
  const userDocRef = doc(firestore, 'users', user.id);
  await setDoc(userDocRef, user, { merge: true });
}
