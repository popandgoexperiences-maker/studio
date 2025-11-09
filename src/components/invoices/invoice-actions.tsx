'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download, Send, Loader2 } from 'lucide-react';
import type { Invoice, User } from '@/lib/definitions';
import { InvoicePDFDocument } from './invoice-pdf-document';
import { useEffect, useState } from 'react';
import type { PDFDownloadLink } from '@react-pdf/renderer';

export function InvoiceActions({ invoice, user }: { invoice: Invoice; user: User }) {
  const [isClient, setIsClient] = useState(false);
  const [PdfLink, setPdfLink] = useState<typeof PDFDownloadLink | null>(null);

  useEffect(() => {
    // This hook ensures that the component only renders on the client side.
    setIsClient(true);
    // Dynamically import the PDFDownloadLink component only on the client
    import('@react-pdf/renderer').then(module => {
      setPdfLink(() => module.PDFDownloadLink);
    });
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isClient && PdfLink ? (
          <DropdownMenuItem asChild>
            <PdfLink
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
            </PdfLink>
          </DropdownMenuItem>
        ) : (
           <DropdownMenuItem disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Generando...</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled>
          <Send className="mr-2 h-4 w-4" />
          <span>Enviar por email</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
