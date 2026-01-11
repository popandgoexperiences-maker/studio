
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { ArrowLeft, Printer, Send } from 'lucide-react';

import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Invoice, User } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/invoices/status-badge';
import Image from 'next/image';

function InvoiceDetailPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-10 w-24" />
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Card>
        <CardHeader className="p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-6 space-y-8">
            <div className="grid sm:grid-cols-2 gap-8">
                <div>
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                </div>
                <div className="text-left sm:text-right">
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-8 w-full mt-2" />
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-6">
            <div className="w-full flex justify-between">
                <Skeleton className="h-16 w-32" />
                <Skeleton className="h-16 w-32" />
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
  const firestore = useFirestore();

  const invoiceRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid, 'invoices', id) : null),
    [firestore, authUser, id]
  );
  const userRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );

  const { data: invoice, isLoading: isInvoiceLoading } = useDoc<Invoice>(invoiceRef);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  const loading = isAuthUserLoading || isInvoiceLoading || isUserLoading;

  if (loading) {
    return <InvoiceDetailPageSkeleton />;
  }

  if (!invoice || !user) {
    return <div className="p-8 text-center">Factura no encontrada.</div>;
  }
  
  const handlePrint = () => {
    window.open(`/invoices/${invoice.id}/print`, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2" />
            Volver a Facturas
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="w-full" onClick={handlePrint}>
                <Printer className="mr-2" />
                Imprimir / PDF
            </Button>
            <Button className="w-full" disabled>
                <Send className="mr-2" />
                Enviar
            </Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="p-6 bg-muted/30 flex flex-col sm:flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">
              Fecha de emisión: {new Date(invoice.date).toLocaleDateString('es-ES')}
            </p>
          </div>
          <StatusBadge status={invoice.status} />
        </CardHeader>
        <CardContent className="p-6 space-y-8">
            {/* User and Client Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold mb-2">De:</h3>
                    {user.logoUrl && (
                      <div className="relative w-24 h-12 mb-2">
                        <Image src={user.logoUrl} alt="Logo" layout="fill" objectFit="contain" />
                      </div>
                    )}
                    <p className="font-bold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.nif}</p>
                    <p className="text-sm text-muted-foreground">{user.address}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="sm:text-right">
                    <h3 className="font-semibold mb-2">Para:</h3>
                    <p className="font-bold">{invoice.client.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client.nif}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client.address}</p>
                </div>
            </div>
            
            {/* Line Items Table */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA ({(user.vatRate ?? 0) * 100}%)</span>
                      <span>{formatCurrency(invoice.vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(invoice.total)}</span>
                  </div>
              </div>
            </div>
        </CardContent>
        {(user.signatureUrl || user.sealUrl) && (
            <CardFooter className="p-6 bg-muted/30 flex justify-between items-end">
                {user.signatureUrl && (
                    <div className="text-center">
                        <div className="relative w-32 h-16">
                            <Image src={user.signatureUrl} alt="Firma" layout="fill" objectFit="contain" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Firma</p>
                    </div>
                )}
                 {user.sealUrl && (
                    <div className="relative w-24 h-24">
                        <Image src={user.sealUrl} alt="Sello" layout="fill" objectFit="contain" />
                    </div>
                )}
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

    