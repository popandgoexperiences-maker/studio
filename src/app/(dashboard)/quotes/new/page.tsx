'use client';
import { PageHeader } from '@/components/page-header';
import { CreateQuoteForm } from '@/components/quotes/create-quote-form';
import type { Client, User } from '@/lib/definitions';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc } from 'firebase/firestore';

export default function NewQuotePage() {
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
  const firestore = useFirestore();

  const clientsQuery = useMemoFirebase(
    () => (authUser ? collection(firestore, 'users', authUser.uid, 'clients') : null),
    [firestore, authUser]
  );
  const userRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );

  const { data: clients, isLoading: areClientsLoading } = useCollection<Client>(clientsQuery);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  const showLoading = isAuthUserLoading || areClientsLoading || isUserLoading;

  return (
    <div>
      <PageHeader
        title="Nuevo Presupuesto"
        description="Rellena los datos para crear un nuevo presupuesto."
      />
      {showLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      ) : user && clients ? (
        <CreateQuoteForm clients={clients} user={user} />
      ) : null}
    </div>
  );
}
