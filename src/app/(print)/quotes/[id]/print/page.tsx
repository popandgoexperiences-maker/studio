import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { getAuthSafe } from '@/lib/firebase-server';
import { fetchUser, getQuote } from '@/lib/data';

import { QuotePrintContent } from './print-content';

export default async function QuotePrintPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) {
    notFound();
  }

  const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
  const userId = decodedToken.uid;

  const quote = await getQuote(userId, params.id);
  const user = await fetchUser(userId);

  if (!quote || !user) {
    notFound();
  }

  return <QuotePrintContent quote={quote} user={user} />;
}
