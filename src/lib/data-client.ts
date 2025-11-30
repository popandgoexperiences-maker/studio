'use client';

import { doc, updateDoc, type Firestore } from 'firebase/firestore';

export async function updateQuote(firestore: Firestore, userId: string, quoteId: string, data: { status: 'accepted' | 'rejected' }) {
    const quoteRef = doc(firestore, 'users', userId, 'quotes', quoteId);
    await updateDoc(quoteRef, data);
}
