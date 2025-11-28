'use client';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, doc, getDocs } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { InvoicesTable, InvoicesTableSkeleton } from '@/components/invoices/invoices-table';
import { Search } from '@/components/search';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import type { Invoice, User } from '@/lib/definitions';
import { useDebouncedCallback } from 'use-debounce';

export default function InvoicesPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Facturas"
          description="Gestiona tus facturas y clientes."
        >
          <div className="flex items-center gap-2">
            <Search placeholder="Buscar facturas..." />
            <Button asChild>
              <Link href="/invoices/new">
                <PlusCircle />
                <span>Nueva Factura</span>
              </Link>
            </Button>
          </div>
        </PageHeader>
        <InvoicesTableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Facturas"
        description="Gestiona tus facturas y clientes."
      >
        <div className="flex items-center gap-2">
          <Search placeholder="Buscar facturas..." />
          <Button asChild>
            <Link href="/invoices/new">
              <Link href="/invoices/new">
                <PlusCircle />
                <span>Nueva Factura</span>
              </Link>
            </Link>
          </Button>
        </div>
      </PageHeader>
      
      <Suspense fallback={<InvoicesTableSkeleton />}>
        <InvoicesTableWrapper userId={user.uid} />
      </Suspense>
    </div>
  );
}

function InvoicesTableWrapper({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('query') || '';
  const firestore = useFirestore();

  const invoicesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'users', userId, 'invoices'),
    [firestore, userId]
  );
  
  const invoicesQuery = useMemoFirebase(
    () => {
      if (!invoicesCollectionRef) return null;

      // If there is a search query, we will perform the search on the server,
      // so we don't need to fetch all invoices.
      if (searchQuery) return null;

      return query(invoicesCollectionRef, orderBy('date', 'desc'));
    },
    [invoicesCollectionRef, searchQuery]
  );

  const { data: initialInvoices, isLoading: isLoadingInitial } = useCollection<Invoice>(invoicesQuery);

  const [searchedInvoices, setSearchedInvoices] = React.useState<Invoice[] | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  const performSearch = useDebouncedCallback(async (queryTerm: string) => {
    if (!invoicesCollectionRef) return;
    setIsSearching(true);

    try {
      // Query by invoice number (exact match for simplicity and performance)
      const numberQuery = query(invoicesCollectionRef, where('invoiceNumber', '==', queryTerm.toUpperCase()));
      
      // Query by client name (prefix search)
      const clientQuery = query(
        invoicesCollectionRef,
        where('client.name', '>=', queryTerm),
        where('client.name', '<=', queryTerm + '\uf8ff')
      );

      const [numberSnap, clientSnap] = await Promise.all([
        getDocs(numberQuery),
        getDocs(clientQuery),
      ]);

      const resultsMap = new Map<string, Invoice>();
      numberSnap.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Invoice));
      clientSnap.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as Invoice));

      setSearchedInvoices(Array.from(resultsMap.values()));
    } catch (error) {
      console.error("Error searching invoices:", error);
      setSearchedInvoices([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  React.useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    } else {
      setSearchedInvoices(null); // Clear search results when query is empty
    }
  }, [searchQuery, performSearch]);

  const userRef = useMemoFirebase(() => doc(firestore, 'users', userId), [firestore, userId]);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  const isLoading = isLoadingInitial || isUserLoading || isSearching;
  const invoices = searchQuery ? searchedInvoices : initialInvoices;

  if (isLoading || !user || invoices === null) {
    return <InvoicesTableSkeleton />;
  }

  return <InvoicesTable invoices={invoices} user={user} />;
}
