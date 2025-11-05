import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { InvoicesTable, InvoicesTableSkeleton } from '@/components/invoices/invoices-table';
import { fetchInvoices } from '@/lib/data';
import { Search } from '@/components/search';

export default function InvoicesPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const query = searchParams?.query || '';

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
      
      <Suspense key={query} fallback={<InvoicesTableSkeleton />}>
        <InvoicesTableWrapper query={query} />
      </Suspense>
    </div>
  );
}

async function InvoicesTableWrapper({ query }: { query: string }) {
  const invoices = await fetchInvoices();
  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.clientName.toLowerCase().includes(query.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(query.toLowerCase())
  );

  return <InvoicesTable invoices={filteredInvoices} />;
}
