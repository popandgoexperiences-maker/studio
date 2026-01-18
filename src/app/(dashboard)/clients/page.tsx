'use client';
import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { Pencil, PlusCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client, Invoice } from '@/lib/definitions';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { DeleteClientButton } from '@/components/clients/delete-client-button';
import { Search } from '@/components/search';

export default function ClientsPage() {
  const { user, isUserLoading } = useUser();

  const headerActions = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Search placeholder="Buscar clientes..." />
      <Button asChild className="w-full sm:w-auto">
        <Link href="/clients/new">
          <PlusCircle />
          <span>Añadir cliente</span>
        </Link>
      </Button>
    </div>
  );

  if (isUserLoading || !user) {
    return (
      <div>
        <PageHeader
          title="Clientes"
          description="Consulta la lista de tus clientes."
        >
          {headerActions}
        </PageHeader>
        <ClientsTableSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Consulta la lista de tus clientes."
      >
        {headerActions}
      </PageHeader>
      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsTableWrapper userId={user.uid} />
      </Suspense>
    </div>
  );
}

function ClientsTableWrapper({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('query') || '';
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const clientsQuery = useMemoFirebase(
    () => (authUser ? collection(firestore, 'users', authUser.uid, 'clients') : null),
    [firestore, authUser]
  );
  const invoicesQuery = useMemoFirebase(
    () => (authUser ? collection(firestore, 'users', authUser.uid, 'invoices') : null),
    [firestore, authUser]
  );

  const { data: allClients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

  const filteredClients = useMemo(() => {
    if (!allClients) {
      return null;
    }
    if (!searchQuery) {
      return allClients;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allClients.filter(client => 
      client.name.toLowerCase().includes(lowercasedQuery) ||
      client.nif.toLowerCase().includes(lowercasedQuery)
    );
  }, [allClients, searchQuery]);

  if (isLoadingClients || isLoadingInvoices || filteredClients === null) {
    return <ClientsTableSkeleton />;
  }

  const clientsWithInvoiceCount = filteredClients.map((client) => ({
    ...client,
    invoiceCount: (invoices || []).filter(
      (invoice) => invoice.client.id === client.id
    ).length,
  }));
  
  if (clientsWithInvoiceCount.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No se encontraron clientes que coincidan con tu búsqueda.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Razón Social</TableHead>
                <TableHead className="hidden sm:table-cell">NIF/CIF</TableHead>
                <TableHead className="hidden md:table-cell">Dirección</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Facturas</TableHead>
                <TableHead className="w-[100px] text-right">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsWithInvoiceCount.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                     <Link href={`/clients/${client.id}`} className="text-primary hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{client.nif}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {client.address}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    <Link href={`/invoices?query=${encodeURIComponent(client.name)}`} className="text-primary hover:underline">
                      {client.invoiceCount}
                    </Link>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                     <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/clients/${client.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar cliente</span>
                        </Link>
                    </Button>
                    <DeleteClientButton clientId={client.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientsTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-32" />
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Skeleton className="h-5 w-24" />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Skeleton className="h-5 w-48" />
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                <Skeleton className="h-5 w-16" />
              </TableHead>
               <TableHead className="w-[100px] text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-5 w-28" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-5 w-56" />
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  <Skeleton className="h-5 w-8 ml-auto" />
                </TableCell>
                <TableCell className='flex justify-end gap-1'>
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
