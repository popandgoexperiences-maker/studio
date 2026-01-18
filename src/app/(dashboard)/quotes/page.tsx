'use client';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, orderBy, doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { QuotesTable, QuotesTableSkeleton } from '@/components/quotes/quotes-table';
import { Search } from '@/components/search';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import type { Quote, User } from '@/lib/definitions';

export default function QuotesPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) {
    return (
      <div>
        <PageHeader
          title="Presupuestos"
          description="Gestiona tus presupuestos y clientes."
        >
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Search placeholder="Buscar presupuestos..." />
            <Button asChild className="w-full sm:w-auto">
              <Link href="/quotes/new">
                <PlusCircle />
                <span>Nuevo Presupuesto</span>
              </Link>
            </Button>
          </div>
        </PageHeader>
        <QuotesTableSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Gestiona tus presupuestos y clientes."
      >
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Search placeholder="Buscar presupuestos..." />
          <Button asChild className="w-full sm:w-auto">
            <Link href="/quotes/new">
              <PlusCircle />
              <span>Nuevo Presupuesto</span>
            </Link>
          </Button>
        </div>
      </PageHeader>
      
      <Suspense fallback={<QuotesTableSkeleton />}>
        <QuotesTableWrapper userId={user.uid} />
      </Suspense>
    </div>
  );
}

function QuotesTableWrapper({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('query') || '';
  const firestore = useFirestore();

  const quotesQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      const quotesCollectionRef = collection(firestore, 'users', userId, 'quotes');
      return query(quotesCollectionRef, orderBy('date', 'desc'));
    },
    [firestore, userId]
  );

  const { data: allQuotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesQuery);

  const filteredQuotes = useMemo(() => {
    if (!allQuotes) {
      return null;
    }
    if (!searchQuery) {
      return allQuotes;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allQuotes.filter(quote => 
      quote.quoteNumber.toLowerCase().includes(lowercasedQuery) ||
      quote.client.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [allQuotes, searchQuery]);

  const userRef = useMemoFirebase(() => (firestore ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  const isLoading = isLoadingQuotes || isUserLoading;

  if (isLoading || !user || filteredQuotes === null) {
    return <QuotesTableSkeleton />;
  }

  return <QuotesTable quotes={filteredQuotes} user={user} />;
}
