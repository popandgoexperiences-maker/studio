'use client';

import { useEffect, useState, useTransition, useActionState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Loader2, Save, UserPlus } from 'lucide-react';
import Link from 'next/link';

import { createQuote } from '@/lib/actions';
import { formatCurrency } from '@/lib/utils';
import type { Client, User } from '@/lib/definitions';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientAutocomplete } from '../invoices/client-autocomplete';
import { Textarea } from '../ui/textarea';
import { SmartCurrencyInput } from '../ui/smart-currency-input';

const lineItemSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida."),
  cantidad: z.coerce.number().min(0.01, "La cantidad debe ser positiva."),
  precioUnitario: z.coerce.number().min(0.01, "El precio debe ser positivo."),
});

const clientSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre del cliente es requerido."),
    nif: z.string().min(1, "El NIF del cliente es requerido."),
    address: z.string().min(1, "La dirección del cliente es requerida."),
});

const quoteSchema = z.object({
  client: clientSchema,
  lineItems: z.array(lineItemSchema).min(1, "Debe haber al menos un concepto."),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

export function CreateQuoteForm({ clients, user }: { clients: Client[], user: User }) {
  const [state, formAction] = useActionState(createQuote, undefined);
  const { toast } = useToast();
  const vatRate = user.vatRate ?? 0.10;
  
  const [isPending, startTransition] = useTransition();
  
  const [totals, setTotals] = useState({ subtotal: 0, iva: 0, total: 0 });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    setValue,
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      client: { id: '', name: '', nif: '', address: '' },
      lineItems: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const clientNameWatch = watch('client.name');
  
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name && (name.startsWith('lineItems') || type === 'change')) {
        calculateTotalsFromLineItems();
      }
    });
    calculateTotalsFromLineItems();
    return () => subscription.unsubscribe();
  }, [watch, vatRate]);

  const calculateTotalsFromLineItems = () => {
      const lineItems = getValues('lineItems');
      const subtotal = lineItems.reduce((acc, item) => {
        const quantity = Number(item.cantidad) || 0;
        const unitPrice = Number(item.precioUnitario) || 0;
        return acc + quantity * unitPrice;
      }, 0);
      
      const iva = subtotal * vatRate;
      const total = subtotal + iva;

      setTotals({ subtotal, iva, total });
    };

  const handleTotalChange = (newTotal: number) => {
    const newSubtotal = newTotal / (1 + vatRate);
    const newVat = newTotal - newSubtotal;

    setTotals({
      total: newTotal,
      subtotal: newSubtotal,
      iva: newVat
    });
    
    const lineItems = getValues('lineItems');
    if(lineItems.length === 1) {
        const roundedSubtotal = Math.round(newSubtotal * 100) / 100;
        setValue('lineItems.0.precioUnitario', roundedSubtotal, { shouldValidate: true });
        setValue('lineItems.0.cantidad', 1);
    }
  };

  const onFormSubmit = (data: QuoteFormValues) => {
    startTransition(() => {
        const formData = new FormData();
        const finalSubtotal = data.lineItems.reduce((acc, item) => {
            return acc + (item.cantidad * item.precioUnitario);
        }, 0);
        const finalVat = finalSubtotal * vatRate;
        const finalTotal = finalSubtotal + finalVat;

        formData.append('client', JSON.stringify(data.client));
        formData.append('lineItems', JSON.stringify(data.lineItems));
        formData.append('subtotal', finalSubtotal.toString());
        formData.append('vat', finalVat.toString());
        formData.append('total', finalTotal.toString());
        
        formAction(formData);
    });
  };
  
  useEffect(() => {
    if (state?.message && !state.errors) {
        toast({
            variant: "destructive",
            title: "Error al crear presupuesto",
            description: state.message,
        });
    }
  }, [state, toast]);


  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Datos del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className='flex items-end gap-2'>
                        <div className="flex-grow">
                            <ClientAutocomplete 
                                clients={clients}
                                value={clientNameWatch}
                                onClientSelect={(client) => {
                                    setValue('client.id', client.id);
                                    setValue('client.name', client.name);
                                    setValue('client.nif', client.nif);
                                    setValue('client.address', client.address);
                                }}
                                onValueChange={(value) => {
                                    setValue('client.name', value);
                                    const client = clients.find(c => c.name.toLowerCase() === value.toLowerCase());
                                    if(client) {
                                      setValue('client.id', client.id);
                                      setValue('client.nif', client.nif);
                                      setValue('client.address', client.address);
                                    } else {
                                        setValue('client.id', '');
                                    }
                                }}
                            />
                        </div>
                        <Button asChild variant="outline" size="icon" className="sm:hidden">
                            <Link href="/clients/new">
                                <UserPlus className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="hidden sm:inline-flex">
                            <Link href="/clients/new">
                                <UserPlus className="h-4 w-4" />
                                <span className='ml-2'>Nuevo Cliente</span>
                            </Link>
                        </Button>
                    </div>
                    {errors.client?.name && <p className="text-sm text-destructive mt-1">{errors.client.name.message}</p>}
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clientNif">NIF/CIF</Label>
                            <Input id="clientNif" {...register('client.nif')} />
                            {errors.client?.nif && <p className="text-sm text-destructive">{errors.client.nif.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientAddress">Dirección</Label>
                            <Input id="clientAddress" {...register('client.address')} />
                            {errors.client?.address && <p className="text-sm text-destructive">{errors.client.address.message}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Conceptos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="w-[100px] hidden sm:table-cell">Cantidad</TableHead>
                                    <TableHead className="w-[150px] hidden sm:table-cell">Precio Unit.</TableHead>
                                    <TableHead className="w-[150px] text-right">Importe</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <Controller
                                                name={`lineItems.${index}.descripcion`}
                                                control={control}
                                                render={({ field }) => <Textarea {...field} placeholder="Ej: Diseño web" />}
                                            />
                                            <div className="sm:hidden mt-2 space-y-2">
                                                 <Input type="number" placeholder="Cant." step="1" {...register(`lineItems.${index}.cantidad`)} />
                                                 <Input type="number" placeholder="Precio" step="0.01" {...register(`lineItems.${index}.precioUnitario`)} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Input type="number" step="1" {...register(`lineItems.${index}.cantidad`)} />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Input type="number" step="0.01" {...register(`lineItems.${index}.precioUnitario`)} />
                                        </TableCell>
                                        <TableCell className="text-right font-medium align-top pt-5">
                                            {formatCurrency((watch(`lineItems.${index}.cantidad`) || 0) * (watch(`lineItems.${index}.precioUnitario`) || 0))}
                                        </TableCell>
                                        <TableCell className="align-top pt-5">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {errors.lineItems && <p className="text-sm text-destructive mt-2">{errors.lineItems.message || errors.lineItems.root?.message}</p>}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ descripcion: '', cantidad: 1, precioUnitario: 0 })} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Añadir concepto
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">IVA ({vatRate * 100}%)</span>
                        <span className="font-medium">{formatCurrency(totals.iva)}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label htmlFor="totalAmount">Total</Label>
                         <SmartCurrencyInput
                            id="totalAmount"
                            value={totals.total}
                            onValueChange={handleTotalChange}
                         />
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 items-stretch">
                   {state?.message && !state.errors && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{state.message}</AlertDescription>
                    </Alert>
                  )}
                    <Button type="submit" size="lg" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isPending ? 'Guardando...' : 'Guardar Presupuesto'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </form>
  );
}
