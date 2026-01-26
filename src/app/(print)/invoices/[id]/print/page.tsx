import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { getAuthSafe } from '@/lib/firebase-server';
import { fetchUser, fetchInvoice } from '@/lib/data';

import { InvoicePrintContent } from './print-content';

export default async function InvoicePrintPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) {
    notFound();
  }

  const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
  const userId = decodedToken.uid;

  const invoice = await fetchInvoice(userId, params.id);
  const user = await fetchUser(userId);

  if (!invoice || !user) {
    notFound();
  }

  return <InvoicePrintContent invoice={invoice} user={user} />;
}
