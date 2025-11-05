'use client';

import { useActionState } from 'react';
import { useEffect } from 'react';
import Image from 'next/image';
import { Save, Upload, Loader2 } from 'lucide-react';

import type { User } from '@/lib/definitions';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { updateSettings } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type SettingsFormProps = {
  user: User;
  images: {
    logo?: ImagePlaceholder;
    signature?: ImagePlaceholder;
    seal?: ImagePlaceholder;
  }
};

export function SettingsForm({ user, images }: SettingsFormProps) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateSettings, undefined);

    useEffect(() => {
        if (state?.message) {
            toast({
                title: state.errors ? 'Error de validación' : 'Configuración',
                description: state.message,
                variant: state.errors ? 'destructive' : 'default',
            });
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Datos de la Empresa/Autónomo</CardTitle>
                    <CardDescription>Esta información aparecerá en tus facturas.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo o Razón Social</Label>
                        <Input id="name" name="name" defaultValue={user.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nif">NIF/CIF</Label>
                        <Input id="nif" name="nif" defaultValue={user.nif} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección Fiscal</Label>
                        <Input id="address" name="address" defaultValue={user.address} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" name="phone" defaultValue={user.phone} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email de Contacto</Label>
                        <Input id="email" name="email" type="email" defaultValue={user.email} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Identidad Visual</CardTitle>
                    <CardDescription>Logo, firma y sello para tus facturas en PDF.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ImageUploadField label="Logo" image={images.logo} currentImageUrl={user.logoUrl} />
                    <Separator />
                    <ImageUploadField label="Firma" image={images.signature} currentImageUrl={user.signatureUrl} />
                    <Separator />
                    <ImageUploadField label="Sello de Empresa" image={images.seal} currentImageUrl={user.sealUrl} />
                </CardContent>
                 <CardFooter>
                    <Button type="submit">
                        <Save className="mr-2" /> Guardar cambios
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

function ImageUploadField({ label, image, currentImageUrl }: { label: string, image?: ImagePlaceholder, currentImageUrl?: string }) {
    const imageUrl = currentImageUrl || image?.imageUrl;
    const imageHint = image?.imageHint || 'image';

    return (
        <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-full sm:w-1/3">
                <Label className="text-base font-medium">{label}</Label>
                <p className="text-sm text-muted-foreground mt-1">Sube una imagen para tu {label.toLowerCase()}.</p>
            </div>
            <div className="w-full sm:w-2/3 flex items-center gap-4">
                <div className="w-48 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50 p-2">
                    {imageUrl ? (
                        <Image src={imageUrl} alt={label} width={160} height={80} className="object-contain" data-ai-hint={imageHint} />
                    ) : (
                        <span className="text-xs text-muted-foreground">Sin imagen</span>
                    )}
                </div>
                <Button variant="outline" type="button">
                    <Upload className="mr-2" /> Cambiar
                </Button>
            </div>
        </div>
    );
}
