'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/actions';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const clientSchema = z.object({
  name: z.string().min(1, "El nombre del cliente es requerido."),
  nif: z.string().min(1, "El NIF del cliente es requerido."),
  address: z.string().min(1, "La dirección del cliente es requerida."),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function CreateClientForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      nif: '',
      address: '',
    },
  });

  const onFormSubmit = (data: ClientFormValues) => {
    setServerError(null);
    startTransition(async () => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('nif', data.nif);
        formData.append('address', data.address);
        
        const result = await createClient(null, formData);

        if (result?.success && result.redirectPath) {
            router.push(result.redirectPath);
        } else if (result?.message) {
            setServerError(result.message);
        } else if (result?.errors) {
            const errorMessages = Object.values(result.errors).flat().join(' ');
            setServerError(errorMessages || 'Hubo un error de validación.');
        } else {
            setServerError('Ocurrió un error inesperado.');
        }
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre o Razón Social</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nif">NIF/CIF</Label>
                    <Input id="nif" {...register('nif')} />
                    {errors.nif && <p className="text-sm text-destructive mt-1">{errors.nif.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" {...register('address')} />
                    {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 items-stretch">
                {serverError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{serverError}</AlertDescription>
                    </Alert>
                )}
                <div className='flex gap-2 justify-end'>
                    <Button variant="ghost" asChild>
                        <Link href="/clients">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isPending ? 'Guardando...' : 'Guardar Cliente'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    </form>
  );
}
