'use client';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { InvoicesTable, InvoicesTableSkeleton } from '@/components/invoices/invoices-table';
import { fetchInvoices, fetchUser } from '@/lib/data';
import { Search } from '@/components/search';
import { useUser } from '@/firebase';
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
    )
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
  const query = searchParams.get('query') || '';
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        try {
            const [invoicesData, userData] = await Promise.all([
                fetchInvoices(userId),
                fetchUser(userId)
            ]);
            setInvoices(invoicesData);
            setUser(userData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, [userId]);

  if (loading || !user) {
    return <InvoicesTableSkeleton />;
  }

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.client.name.toLowerCase().includes(query.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(query.toLowerCase())
  );

  return <InvoicesTable invoices={filteredInvoices} user={user} />;
}
