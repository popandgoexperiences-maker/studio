'use client';

import { useMemo, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { ArrowLeft, Edit, FileOutput, Printer, Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Quote, User } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { convertQuoteToInvoice } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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
import { StatusBadge } from '@/components/quotes/status-badge';

function QuoteDetailPageSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-10 w-24" />
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Card>
        <CardHeader className="p-6 md:p-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-6 md:p-8 md:pt-0 space-y-8">
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
        <CardFooter className="p-6 md:p-8 md:pt-0">
            <div className="w-full text-xs text-muted-foreground">
                <p>Presupuesto generado. Este documento no es una factura.</p>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
  const firestore = useFirestore();
  const [isConverting, startTransition] = useTransition();

  const quoteRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid, 'quotes', id) : null),
    [firestore, authUser, id]
  );
  const userRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );

  const { data: quote, isLoading: isQuoteLoading } = useDoc<Quote>(quoteRef);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  const loading = isAuthUserLoading || isQuoteLoading || isUserLoading;
  
  const handleConvert = () => {
    if (quote?.status === 'accepted' && quote.invoiceId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Este presupuesto ya ha sido convertido a factura.',
        });
        return;
    }
    startTransition(async () => {
      const result = await convertQuoteToInvoice(id);
      if (result?.success && result.redirectPath) {
        toast({
          title: '¡Éxito!',
          description: 'Presupuesto convertido a factura correctamente.',
        });
        router.push(result.redirectPath);
      } else if (result?.message) {
        toast({
          variant: 'destructive',
          title: 'Error al convertir',
          description: result.message,
        });
      }
    });
  };

  const handlePrint = () => {
    window.open(`/quotes/${id}/print`, '_blank');
  };

  if (loading) {
    return <QuoteDetailPageSkeleton />;
  }

  if (!quote || !user) {
    return <div className="p-8 text-center">Presupuesto no encontrado.</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2" />
            Volver a Presupuestos
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="w-full" onClick={handlePrint}>
                <Printer className="mr-2" />
                Imprimir / PDF
            </Button>
             <Button className="w-full" onClick={handleConvert} disabled={isConverting || (quote.status === 'accepted' && !!quote.invoiceId)}>
                <FileOutput className="mr-2" />
                {isConverting ? 'Convirtiendo...' : (quote.invoiceId ? 'Ya convertido' : 'Convertir en Factura')}
            </Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        {quote.invoiceId && (
            <div className="border-b border-green-200 bg-green-100 p-4 dark:border-green-700/50 dark:bg-green-900/30">
                <p className="text-center text-sm font-medium text-green-800 dark:text-green-300">
                    Este presupuesto fue aceptado y convertido en factura.{' '}
                    <Link href={`/invoices/${quote.invoiceId}`} className="font-bold underline hover:no-underline">
                        Ver la factura
                    </Link>
                </p>
            </div>
        )}
        <CardHeader className="p-6 md:p-8 bg-muted/30 flex flex-col sm:flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">{quote.quoteNumber}</h1>
            <p className="text-muted-foreground">
              Fecha de emisión: {new Date(quote.date).toLocaleDateString('es-ES')}
            </p>
          </div>
          <StatusBadge status={quote.status} />
        </CardHeader>
        <CardContent className="p-6 md:p-8 md:pt-0 space-y-8">
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
                    <p className="font-bold">{quote.client.name}</p>
                    <p className="text-sm text-muted-foreground">{quote.client.nif}</p>
                    <p className="text-sm text-muted-foreground">{quote.client.address}</p>
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
                  {quote.lineItems.map((item, index) => (
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
                      <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA ({(user.vatRate ?? 0) * 100}%)</span>
                      <span>{formatCurrency(quote.vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(quote.total)}</span>
                  </div>
              </div>
            </div>
        </CardContent>
        <CardFooter className="p-6 md:p-8 md:pt-0 bg-muted/30">
            <p className="text-xs text-muted-foreground">Este documento es un presupuesto y no tiene validez como factura.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
