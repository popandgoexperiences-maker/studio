'use client';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, orderBy, doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { InvoicesTable, InvoicesTableSkeleton } from '@/components/invoices/invoices-table';
import { Search } from '@/components/search';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import type { Invoice, User } from '@/lib/definitions';

export default function InvoicesPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) {
    return (
      <div>
        <PageHeader
          title="Facturas"
          description="Gestiona tus facturas y clientes."
        >
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Search placeholder="Buscar facturas..." />
            <Button asChild className="w-full sm:w-auto">
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
    <div>
      <PageHeader
        title="Facturas"
        description="Gestiona tus facturas y clientes."
      >
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Search placeholder="Buscar facturas..." />
          <Button asChild className="w-full sm:w-auto">
            <Link href="/invoices/new">
              <PlusCircle />
              <span>Nueva Factura</span>
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

  const invoicesQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      const invoicesCollectionRef = collection(firestore, 'users', userId, 'invoices');
      return query(invoicesCollectionRef, orderBy('date', 'desc'));
    },
    [firestore, userId]
  );

  const { data: allInvoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);
  
  const filteredInvoices = useMemo(() => {
    if (!allInvoices) {
      return null;
    }
    if (!searchQuery) {
      return allInvoices;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allInvoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(lowercasedQuery) ||
      invoice.client.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [allInvoices, searchQuery]);

  const userRef = useMemoFirebase(() => (firestore ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  const isLoading = isLoadingInvoices || isUserLoading;

  if (isLoading || !user || filteredInvoices === null) {
    return <InvoicesTableSkeleton />;
  }

  return <InvoicesTable invoices={filteredInvoices} user={user} />;
}
