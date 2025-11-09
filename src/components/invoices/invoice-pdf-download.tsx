'use client';

import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Invoice, User } from '@/lib/definitions';
import { InvoicePDFDocument } from './invoice-pdf-document';
import { Button } from '../ui/button';
import { Download, Loader2 } from 'lucide-react';

interface InvoicePDFDownloadProps {
  invoice: Invoice;
  user: User;
  children: React.ReactNode;
}

export function InvoicePDFDownload({ invoice, user, children }: InvoicePDFDownloadProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || invoice.status === 'generating') {
    return (
      <span className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors opacity-50">
        <Download className="mr-2 h-4 w-4" />
        <span>Descargar PDF</span>
      </span>
    );
  }

  return (
    <PDFDownloadLink
      document={<InvoicePDFDocument invoice={invoice} user={user} />}
      fileName={`factura-${invoice.invoiceNumber}.pdf`}
      className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
    >
      {({ blob, url, loading, error }) => 
        loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Generando...</span>
          </>
        ) : (
          children
        )
      }
    </PDFDownloadLink>
  );
}
