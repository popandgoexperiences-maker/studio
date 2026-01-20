'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { updateClient } from '@/lib/actions';
import type { Client } from '@/lib/definitions';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {pending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
    );
}

export function EditClientForm({ client }: { client: Client }) {
  const updateClientWithId = updateClient.bind(null, client.id);
  const [state, formAction] = useActionState(updateClientWithId, undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message && !state.errors) {
        toast({
            variant: "destructive",
            title: "Error al actualizar",
            description: state.message,
        })
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre o Razón Social</Label>
                    <Input id="name" name="name" defaultValue={client.name} required />
                     {state?.errors?.name && <p className="text-sm text-destructive mt-1">{state.errors.name[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nif">NIF/CIF</Label>
                    <Input id="nif" name="nif" defaultValue={client.nif} required />
                    {state?.errors?.nif && <p className="text-sm text-destructive mt-1">{state.errors.nif[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" name="address" defaultValue={client.address} required />
                    {state?.errors?.address && <p className="text-sm text-destructive mt-1">{state.errors.address[0]}</p>}
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
                    <SubmitButton />
                </div>
            </CardFooter>
        </Card>
    </form>
  );
}
