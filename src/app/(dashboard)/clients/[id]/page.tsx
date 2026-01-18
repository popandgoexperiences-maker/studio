
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { doc, collection, query, where } from 'firebase/firestore';

import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Client, Invoice, Quote } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge as InvoiceStatusBadge } from '@/components/invoices/status-badge';
import { StatusBadge as QuoteStatusBadge } from '@/components/quotes/status-badge';
import { PageHeader } from '@/components/page-header';

function ClientDetailPageSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
  const firestore = useFirestore();

  // --- Refs ---
  const clientRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid, 'clients', id) : null),
    [firestore, authUser, id]
  );
  
  const invoicesQuery = useMemoFirebase(
    () => (authUser ? query(collection(firestore, 'users', authUser.uid, 'invoices'), where('client.id', '==', id)) : null),
    [firestore, authUser, id]
  );

  const quotesQuery = useMemoFirebase(
    () => (authUser ? query(collection(firestore, 'users', authUser.uid, 'quotes'), where('client.id', '==', id)) : null),
    [firestore, authUser, id]
  );


  // --- Data Hooks ---
  const { data: client, isLoading: isClientLoading } = useDoc<Client>(clientRef);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection<Invoice>(invoicesQuery);
  const { data: quotes, isLoading: isQuotesLoading } = useCollection<Quote>(quotesQuery);

  const loading = isAuthUserLoading || isClientLoading || isInvoicesLoading || isQuotesLoading;

  if (loading) {
    return <ClientDetailPageSkeleton />;
  }

  if (!client) {
    return (
        <div className="text-center">
            <PageHeader title="Cliente no encontrado" description="No se pudo encontrar al cliente solicitado." />
             <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2" />
                Volver
            </Button>
        </div>
    );
  }
  
  const combinedDocuments = [
    ...(invoices || []).map(inv => ({ ...inv, type: 'invoice' as const, number: inv.invoiceNumber })),
    ...(quotes || []).map(q => ({ ...q, type: 'quote' as const, number: q.quoteNumber }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <div>
      <PageHeader
        title={client.name}
        description="Aquí puedes ver toda la información y actividad de tu cliente."
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2" />
                Volver a Clientes
            </Button>
             <Button asChild>
                <Link href={`/clients/${client.id}/edit`}>
                    <Pencil className="mr-2" />
                    Editar
                </Link>
            </Button>
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Detalles del cliente y documentos */}
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Datos de Contacto</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                        <div>
                            <p className="text-muted-foreground">NIF/CIF</p>
                            <p className="font-medium">{client.nif}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Dirección</p>
                            <p className="font-medium">{client.address}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Documentos</CardTitle>
                    <CardDescription>Facturas y presupuestos asociados a este cliente.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Documento</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                            <TableHead className="hidden md:table-cell">Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {combinedDocuments.map(doc => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/${doc.type}s/${doc.id}`} className="text-primary hover:underline">
                                        {doc.number}
                                    </Link>
                                </TableCell>
                                <TableCell className="capitalize">{doc.type === 'invoice' ? 'Factura' : 'Presupuesto'}</TableCell>
                                <TableCell className="hidden sm:table-cell">{new Date(doc.date).toLocaleDateString('es-ES')}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {doc.type === 'invoice' 
                                        ? <InvoiceStatusBadge status={doc.status as Invoice['status']} />
                                        : <QuoteStatusBadge status={doc.status as Quote['status']} />
                                    }
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(doc.total)}</TableCell>
                            </TableRow>
                        ))}
                         {combinedDocuments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Este cliente no tiene documentos asociados.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Columna Derecha: Resumen */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Resumen Financiero</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Facturado</span>
                        <span className="font-bold text-lg">{formatCurrency(invoices?.reduce((sum, inv) => sum + inv.total, 0) ?? 0)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pendiente de Pago</span>
                        <span className="font-medium text-yellow-600">{formatCurrency(invoices?.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total, 0) ?? 0)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Pagado</span>
                        <span className="font-medium text-green-600">{formatCurrency(invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0) ?? 0)}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Presupuestos Enviados</span>
                        <span className="font-medium">{quotes?.length ?? 0}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
