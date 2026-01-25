'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import type { Quote, User } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QuoteActions } from './quote-actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function QuotesTable({ quotes, user }: { quotes: Quote[], user: User }) {
  if (!quotes || quotes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No se encontraron presupuestos.
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
                <TableHead className="w-[120px]">Nº Presupuesto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="w-[50px]">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote?.id}>
                  <TableCell className="font-medium">
                     <Link href={`/quotes/${quote?.id}`} className="text-primary hover:underline">
                        {quote?.quoteNumber ?? 'N/A'}
                    </Link>
                  </TableCell>
                  <TableCell>{quote?.client?.name ?? 'Cliente no disponible'}</TableCell>
                  <TableCell className="hidden sm:table-cell">{quote?.date ? new Date(quote.date).toLocaleDateString('es-ES') : 'Sin fecha'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(quote?.total ?? 0)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {quote?.invoiceId ? (
                        <Link href={`/invoices/${quote.invoiceId}`}>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50 cursor-pointer">
                                Facturado
                            </Badge>
                        </Link>
                    ) : (
                        quote?.status && <StatusBadge status={quote.status} />
                    )}
                  </TableCell>
                  <TableCell>
                    {quote && <QuoteActions quote={quote} />}
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

export function QuotesTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]"><Skeleton className="h-5 w-24" /></TableHead>
              <TableHead><Skeleton className="h-5 w-32" /></TableHead>
              <TableHead className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableHead>
              <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
              <TableHead className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-8 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
