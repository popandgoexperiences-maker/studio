'use client';

import { useActionState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { updateClient } from '@/lib/actions';
import type { Client } from '@/lib/definitions';

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

export function EditClientForm({ client }: { client: Client }) {
  const updateClientWithId = updateClient.bind(null, client.id);
  const [state, formAction] = useActionState(updateClientWithId, undefined);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      nif: client.nif,
      address: client.address,
    },
  });

  useEffect(() => {
    if (!isPending && state?.success && state.redirectPath) {
      router.push(state.redirectPath);
    }
  }, [state, router, isPending]);

  const onFormSubmit = (data: ClientFormValues) => {
    startTransition(() => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('nif', data.nif);
        formData.append('address', data.address);
        formAction(formData);
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
                {state?.message && !state.errors && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{state.message}</AlertDescription>
                    </Alert>
                )}
                <div className='flex gap-2 justify-end'>
                    <Button variant="ghost" asChild>
                        <Link href="/clients">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    </form>
  );
}
