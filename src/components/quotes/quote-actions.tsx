'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download, Send, FileOutput, Check, X, Trash2 } from 'lucide-react';
import type { Quote } from '@/lib/definitions';
import { convertQuoteToInvoice } from '@/lib/actions';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateQuote } from '@/lib/data-client';
import { useFirestore, useUser } from '@/firebase';
import { DeleteQuoteButton } from './delete-quote-button';

export function QuoteActions({ quote }: { quote: Quote }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const handleDownload = () => {
    window.open(`/quotes/${quote.id}/print`, '_blank');
  };
  
  const handleConvert = () => {
    if (quote.status === 'accepted' && quote.invoiceId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Este presupuesto ya ha sido convertido a factura.',
        });
        return;
    }
    startTransition(async () => {
      const result = await convertQuoteToInvoice(quote.id);
      if (result?.message) {
        toast({
          variant: 'destructive',
          title: 'Error al convertir',
          description: result.message,
        });
      } else {
        toast({
          title: '¡Éxito!',
          description: 'Presupuesto convertido a factura correctamente.',
        });
      }
    });
  };

  const handleStatusChange = (status: 'accepted' | 'rejected') => {
    if (!user || !firestore) return;

    startTransition(async () => {
        try {
            await updateQuote(firestore, user.uid, quote.id, { status });
            toast({
                title: 'Estado actualizado',
                description: `El presupuesto ha sido marcado como ${status === 'accepted' ? 'aceptado' : 'rechazado'}.`
            })
        } catch(e: any) {
            toast({
                title: 'Error',
                description: `No se pudo actualizar el estado: ${e.message}`,
                variant: 'destructive'
            })
        }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          <span>Descargar PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Send className="mr-2 h-4 w-4" />
          <span>Enviar por email</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleStatusChange('accepted')} disabled={isPending}>
            <Check className="mr-2 h-4 w-4" />
            <span>Marcar como aceptado</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('rejected')} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />
            <span>Marcar como rechazado</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleConvert} disabled={isPending || quote.status === 'accepted' && !!quote.invoiceId}>
          <FileOutput className="mr-2 h-4 w-4" />
          <span>{quote.invoiceId ? 'Ya convertido' : 'Convertir en Factura'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <DeleteQuoteButton quoteId={quote.id} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
