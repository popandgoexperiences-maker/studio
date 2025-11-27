'use client';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy } from 'firebase/firestore';

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
    () => query(
      collection(firestore, 'users', userId, 'invoices'),
      orderBy('date', 'desc')
    ),
    [firestore, userId]
  );
  
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection<Invoice>(invoicesQuery);
  
  // Note: We are fetching the user profile again. This could be optimized
  // by passing the user object down or using a separate context for user profile.
  // For now, this is fine.
  const userRef = useMemoFirebase(() => doc(firestore, 'users', userId), [firestore, userId]);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  if (isInvoicesLoading || isUserLoading || !user || !invoices) {
    return <InvoicesTableSkeleton />;
  }

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return <InvoicesTable invoices={filteredInvoices} user={user} />;
}
