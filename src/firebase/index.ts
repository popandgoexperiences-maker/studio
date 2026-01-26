'use client';

// src/firebase/index.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from './config';


let firebaseApp: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

export function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = getApps().length
      ? getApp()
      : initializeApp(firebaseConfig);

    if (typeof window !== "undefined") {
      try {
        firestore = initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch (e: any) {
          // This can happen in several scenarios, like multiple tabs open
          // or in some hot-reloading situations. We'll log the warning
          // and fall back to the default Firestore instance.
          console.warn("Could not initialize Firestore with persistence:", e.message);
          firestore = getFirestore(firebaseApp);
      }
    } else {
      firestore = getFirestore(firebaseApp);
    }

    auth = getAuth(firebaseApp);
  }

  return {
    firebaseApp,
    firestore,
    auth,
  };
}
export { useAuth, useFirestore, useFirebase, useUser } from "./provider";
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useMemoFirebase } from './provider';
