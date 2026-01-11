'use client';
import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
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
import { collection, query } from 'firebase/firestore';

export default function ClientsPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Clientes"
          description="Consulta la lista de tus clientes y sus facturas."
        >
          <Button asChild size="sm">
            <Link href="/clients/new">
              <PlusCircle />
              <span className="hidden sm:inline">Nuevo Cliente</span>
            </Link>
          </Button>
        </PageHeader>
        <ClientsTableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Clientes"
        description="Consulta la lista de tus clientes y sus facturas."
      >
        <Button asChild size="sm">
          <Link href="/clients/new">
            <PlusCircle />
            <span className="hidden sm:inline">Nuevo Cliente</span>
          </Link>
        </Button>
      </PageHeader>
      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsTableWrapper userId={user.uid} />
      </Suspense>
    </div>
  );
}

function ClientsTableWrapper({ userId }: { userId: string }) {
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

  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

  if (isLoadingClients || isLoadingInvoices) {
    return <ClientsTableSkeleton />;
  }

  const clientsWithInvoiceCount = (clients || []).map((client) => ({
    ...client,
    invoiceCount: (invoices || []).filter(
      (invoice) => invoice.client.id === client.id
    ).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Clientes</CardTitle>
        <CardDescription>
          Aquí puedes ver todos tus clientes registrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Razón Social</TableHead>
                <TableHead className="hidden sm:table-cell">NIF/CIF</TableHead>
                <TableHead className="hidden md:table-cell">Dirección</TableHead>
                <TableHead className="text-right">Facturas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsWithInvoiceCount.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{client.nif}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {client.address}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/invoices?query=${encodeURIComponent(client.name)}`} className="text-primary hover:underline">
                      {client.invoiceCount}
                    </Link>
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
      <CardHeader>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
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
              <TableHead className="text-right">
                <Skeleton className="h-5 w-16" />
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
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
