'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormState } from 'react-dom';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';

import { createInvoice } from '@/lib/actions';
import { formatCurrency } from '@/lib/utils';
import { calculateInvoiceAmounts } from '@/ai/flows/calculate-invoice-amounts';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const lineItemSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida."),
  cantidad: z.coerce.number().min(0.01, "La cantidad debe ser positiva."),
  precioUnitario: z.coerce.number().min(0.01, "El precio debe ser positivo."),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es requerido."),
  clientNif: z.string().min(1, "El NIF del cliente es requerido."),
  clientAddress: z.string().min(1, "La dirección del cliente es requerida."),
  lineItems: z.array(lineItemSchema).min(1, "Debe haber al menos un concepto."),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function CreateInvoiceForm() {
  const [state, formAction] = useFormState(createInvoice, undefined);
  const { toast } = useToast();
  
  const [isPending, startTransition] = useTransition();
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [totals, setTotals] = useState({ subtotal: 0, iva: 0, total: 0 });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: '',
      clientNif: '',
      clientAddress: '',
      lineItems: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const lineItemsWatch = watch('lineItems');

  useEffect(() => {
    const calculateTotals = async () => {
      const lineItems = getValues('lineItems').filter(
        item => item.descripcion && item.cantidad > 0 && item.precioUnitario > 0
      );

      if (lineItems.length > 0) {
        setIsCalculating(true);
        try {
          const result = await calculateInvoiceAmounts({ conceptos: lineItems.map(i => ({...i, precioUnitario: Number(i.precioUnitario), cantidad: Number(i.cantidad)})) });
          if (result) {
            setTotals(result);
          }
        } catch (error) {
          console.error("Error calculating totals:", error);
          toast({
            variant: "destructive",
            title: "Error de cálculo",
            description: "No se pudieron calcular los totales automáticamente.",
          });
        } finally {
          setIsCalculating(false);
        }
      } else {
        setTotals({ subtotal: 0, iva: 0, total: 0 });
      }
    };
    
    const handler = setTimeout(() => {
        calculateTotals();
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [lineItemsWatch, getValues, toast]);
  
  const onFormSubmit = (data: InvoiceFormValues) => {
    startTransition(() => {
        const formData = new FormData();
        formData.append('clientName', data.clientName);
        formData.append('clientNif', data.clientNif);
        formData.append('clientAddress', data.clientAddress);
        formData.append('lineItems', JSON.stringify(data.lineItems));
        formData.append('subtotal', totals.subtotal.toString());
        formData.append('vat', totals.iva.toString());
        formData.append('total', totals.total.toString());
        
        formAction(formData);
    });
  };
  
  useEffect(() => {
    if (state?.message && !state.errors) {
        toast({
            variant: "destructive",
            title: "Error al crear factura",
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
                <CardContent className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="clientName">Nombre o Razón Social</Label>
                        <Input id="clientName" {...register('clientName')} />
                        {errors.clientName && <p className="text-sm text-destructive">{errors.clientName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientNif">NIF/CIF</Label>
                        <Input id="clientNif" {...register('clientNif')} />
                        {errors.clientNif && <p className="text-sm text-destructive">{errors.clientNif.message}</p>}
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="clientAddress">Dirección</Label>
                        <Input id="clientAddress" {...register('clientAddress')} />
                        {errors.clientAddress && <p className="text-sm text-destructive">{errors.clientAddress.message}</p>}
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
                                    <TableHead className="w-[100px]">Cantidad</TableHead>
                                    <TableHead className="w-[150px]">Precio Unit.</TableHead>
                                    <TableHead className="w-[150px] text-right">Importe</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <Input {...register(`lineItems.${index}.descripcion`)} placeholder="Ej: Diseño web" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" step="1" {...register(`lineItems.${index}.cantidad`)} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" step="0.01" {...register(`lineItems.${index}.precioUnitario`)} />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency((watch(`lineItems.${index}.cantidad`) || 0) * (watch(`lineItems.${index}.precioUnitario`) || 0))}
                                        </TableCell>
                                        <TableCell>
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
                        <span className="text-muted-foreground">IVA (10%)</span>
                        <span className="font-medium">{formatCurrency(totals.iva)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(totals.total)}</span>
                    </div>
                    {isCalculating && 
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...
                        </div>
                    }
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
                        {isPending ? 'Guardando...' : 'Guardar Factura'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </form>
  );
}
