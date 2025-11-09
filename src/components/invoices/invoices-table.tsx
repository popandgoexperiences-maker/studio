'use client';

import dynamic from 'next/dynamic';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download, Send, Loader2 } from 'lucide-react';
import type { Invoice, User } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoicePDFDocument } from './invoice-pdf-document';

// Dynamically import the PDF download component and disable SSR
const PDFDownloadLink = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink), {
  ssr: false,
  loading: () => (
    <div className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      <span>Cargando...</span>
    </div>
  ),
});


export function InvoicesTable({ invoices, user }: { invoices: Invoice[], user: User }) {
    if (invoices.length === 0) {
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Nº Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden sm:table-cell">Estado</TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.client.name}</TableCell>
                <TableCell className="hidden md:table-cell">{new Date(invoice.date).toLocaleDateString('es-ES')}</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <PDFDownloadLink
                          document={<InvoicePDFDocument invoice={invoice} user={user} />}
                          fileName={`factura-${invoice.invoiceNumber}.pdf`}
                          className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                        >
                          {({ loading }) => 
                            loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Generando...</span>
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Descargar PDF</span>
                              </>
                            )
                          }
                        </PDFDownloadLink>
                      <DropdownMenuItem disabled={!invoice.pdfUrl || invoice.status === 'generating'}>
                        <Send className="mr-2 h-4 w-4" />
                        <span>Enviar por email</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
              <TableHead className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableHead>
              <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
              <TableHead className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
