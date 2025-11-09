'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Invoice, User } from '@/lib/definitions';
import { InvoicePDFDocument } from './invoice-pdf-document';
import { Loader2 } from 'lucide-react';

interface InvoicePDFDownloadProps {
  invoice: Invoice;
  user: User;
  children: React.ReactNode;
  className?: string;
}

export function InvoicePDFDownload({ invoice, user, children, className }: InvoicePDFDownloadProps) {
  
  const defaultClassName = "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground";

  if (invoice.status === 'generating') {
    return (
      <span className={`${defaultClassName} opacity-50`}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Generando...</span>
      </span>
    );
  }

  return (
    <PDFDownloadLink
      document={<InvoicePDFDocument invoice={invoice} user={user} />}
      fileName={`factura-${invoice.invoiceNumber}.pdf`}
      className={className || defaultClassName}
    >
      {({ loading }) => 
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
