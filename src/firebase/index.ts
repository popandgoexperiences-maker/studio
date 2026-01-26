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
import { enableIndexedDbPersistence } from 'firebase/firestore';


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
        enableIndexedDbPersistence(firestore).catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code == 'unimplemented') {
                console.warn('The current browser does not support all of the features required to enable persistence.');
            }
        });
      } catch (e) {
          console.error("Error initializing Firestore with persistence:", e);
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