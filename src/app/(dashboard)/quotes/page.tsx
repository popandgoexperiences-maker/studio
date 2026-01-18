'use client';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, doc, getDocs } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { QuotesTable, QuotesTableSkeleton } from '@/components/quotes/quotes-table';
import { Search } from '@/components/search';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import type { Quote, User } from '@/lib/definitions';
import { useDebouncedCallback } from 'use-debounce';

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

  const quotesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users', userId, 'quotes') : null),
    [firestore, userId]
  );
  
  const quotesQuery = useMemoFirebase(
    () => {
      if (!quotesCollectionRef) return null;
      if (searchQuery) return null;
      return query(quotesCollectionRef, orderBy('date', 'desc'));
    },
    [quotesCollectionRef, searchQuery]
  );

  const { data: initialQuotes, isLoading: isLoadingInitial } = useCollection<Quote>(quotesQuery);

  const [searchedQuotes, setSearchedQuotes] = useState<Quote[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useDebouncedCallback(async (queryTerm: string) => {
    if (!quotesCollectionRef) return;
    setIsSearching(true);

    try {
      const numberQuery = query(quotesCollectionRef, where('quoteNumber', '==', queryTerm.toUpperCase()));
      const clientQuery = query(
        quotesCollectionRef,
        where('client.name', '>=', queryTerm),
        where('client.name', '<=', queryTerm + '\uf8ff')
      );

      const [numberSnap, clientSnap] = await Promise.all([
        getDocs(numberQuery),
        getDocs(clientQuery),
      ]);

      const resultsMap = new Map<string, Quote>();
      numberSnap.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Quote));
      clientSnap.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Quote));

      setSearchedQuotes(Array.from(resultsMap.values()));
    } catch (error) {
      console.error("Error searching quotes:", error);
      setSearchedQuotes([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    } else {
      setSearchedQuotes(null);
    }
  }, [searchQuery, performSearch]);

  const userRef = useMemoFirebase(() => (firestore ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  const isLoading = isLoadingInitial || isUserLoading || isSearching;
  const quotes = searchQuery ? searchedQuotes : initialQuotes;

  if (isLoading || !user || quotes === null) {
    return <QuotesTableSkeleton />;
  }

  return <QuotesTable quotes={quotes} user={user} />;
}
