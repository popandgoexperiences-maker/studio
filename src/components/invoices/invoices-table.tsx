'use client';

import Link from 'next/link';
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
import type { Invoice, User } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceActions } from './invoice-actions';

export function InvoicesTable({ invoices, user }: { invoices: Invoice[], user: User }) {
  if (!invoices || invoices.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No se encontraron facturas.
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
                <TableHead className="w-[120px]">Nº Factura</TableHead>
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
              {invoices.map((invoice) => (
                <TableRow key={invoice?.id}>
                  <TableCell className="font-medium">
                    <Link href={`/invoices/${invoice?.id}`} className="text-primary hover:underline">
                      {invoice?.invoiceNumber ?? 'N/A'}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice?.client?.name ?? 'Cliente no disponible'}</TableCell>
                  <TableCell className="hidden sm:table-cell">{invoice?.date ? new Date(invoice.date).toLocaleDateString('es-ES') : 'Sin fecha'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice?.total ?? 0)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {invoice?.status && <StatusBadge status={invoice.status} />}
                  </TableCell>
                  <TableCell>
                    {invoice && <InvoiceActions invoice={invoice} />}
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

export function InvoicesTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]"><Skeleton className="h-5 w-20" /></TableHead>
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

    
