import { Suspense } from 'react';
import { fetchClients, fetchInvoices } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
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
import Link from 'next/link';

export default function ClientsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Clientes"
        description="Consulta la lista de tus clientes y sus facturas."
      />
      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsTableWrapper />
      </Suspense>
    </div>
  );
}

async function ClientsTableWrapper() {
  const [clients, invoices] = await Promise.all([
    fetchClients(),
    fetchInvoices(),
  ]);

  const clientsWithInvoiceCount = clients.map((client) => ({
    ...client,
    invoiceCount: invoices.filter((invoice) => invoice.client.id === client.id)
      .length,
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre / Razón Social</TableHead>
              <TableHead>NIF/CIF</TableHead>
              <TableHead className="hidden sm:table-cell">Dirección</TableHead>
              <TableHead className="text-right">Facturas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsWithInvoiceCount.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.nif}</TableCell>
                <TableCell className="hidden sm:table-cell">
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
              <TableHead>
                <Skeleton className="h-5 w-24" />
              </TableHead>
              <TableHead className="hidden sm:table-cell">
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
                <TableCell>
                  <Skeleton className="h-5 w-28" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
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
