'use client';

import { useActionState, useTransition } from 'react';
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Save, Upload, Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import type { User } from '@/lib/definitions';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { updateSettings } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SignaturePad, type SignaturePadHandle } from './signature-pad';

type SettingsFormProps = {
  user: User;
  images: {
    logo?: ImagePlaceholder;
    seal?: ImagePlaceholder;
  }
};

const settingsSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  email: z.string().email('Email inválido.'),
  nif: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  vatRate: z.coerce.number().min(0, "El IVA no puede ser negativo.").optional(),
  logo: z.any().optional(),
  signature: z.string().optional(),
  seal: z.any().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ user, images }: SettingsFormProps) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateSettings, undefined);
    const [isPending, startTransition] = useTransition();
    const signaturePadRef = useRef<SignaturePadHandle>(null);
    
    const { register, handleSubmit, control, formState: { errors } } = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            nif: user.nif || '',
            address: user.address || '',
            phone: user.phone || '',
            vatRate: user.vatRate ? user.vatRate * 100 : 21,
            signature: user.signatureUrl || '',
        },
    });

    useEffect(() => {
        if (state?.message) {
            toast({
                title: state.errors ? 'Error de validación' : 'Configuración',
                description: state.message,
                variant: state.errors ? 'destructive' : 'default',
            });
        }
    }, [state, toast]);

    const onFormSubmit = (data: SettingsFormValues) => {
        const formData = new FormData();
        const newSignatureData = signaturePadRef.current?.getSignatureData();

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'signature') {
                const finalSignature = newSignatureData ?? value ?? '';
                formData.append('signature', finalSignature);
            } else if (value instanceof FileList) {
                if (value.length > 0) {
                    formData.append(key, value[0]);
                }
            } else if (value !== undefined && value !== null) {
                 formData.append(key, String(value));
            }
        });
        
        startTransition(() => {
            formAction(formData);
        });
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-10">
            <Card>
                <CardHeader>
                    <CardTitle>Datos de la Empresa/Autónomo</CardTitle>
                    <CardDescription>Esta información aparecerá en tus facturas.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Nombre Completo o Razón Social</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nif">NIF/CIF</Label>
                        <Input id="nif" {...register('nif')} />
                        {errors.nif && <p className="text-destructive text-sm mt-1">{errors.nif.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección Fiscal</Label>
                        <Input id="address" {...register('address')} />
                        {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" {...register('phone')} />
                         {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email de Contacto</Label>
                        <Input id="email" type="email" {...register('email')} />
                        {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="vatRate">Tipo de IVA (%)</Label>
                        <Input 
                            id="vatRate" 
                            type="number" 
                            step="1"
                            placeholder="Ej: 21"
                            {...register('vatRate')}
                        />
                        {errors.vatRate && <p className="text-destructive text-sm mt-1">{errors.vatRate.message}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Identidad Visual</CardTitle>
                    <CardDescription>Logo, firma y sello para tus facturas en PDF.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <ImageUploadField 
                        name="logo" 
                        label="Logo" 
                        image={images.logo} 
                        currentImageUrl={user.logoUrl} 
                        register={register} 
                    />
                    <Separator />
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="w-full sm:w-1/3">
                            <Label className="text-base font-medium">Firma</Label>
                            <p className="text-sm text-muted-foreground mt-1">Dibuja tu firma en el recuadro. Se guardará al hacer clic en "Guardar cambios".</p>
                        </div>
                        <div className="w-full sm:w-2/3 flex flex-col items-start gap-4">
                            <Controller
                                name="signature"
                                control={control}
                                render={({ field }) => (
                                    <SignaturePad 
                                        ref={signaturePadRef}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <Separator />
                    <ImageUploadField 
                        name="seal" 
                        label="Sello de Empresa" 
                        image={images.seal} 
                        currentImageUrl={user.sealUrl}
                        register={register} 
                    />
                </CardContent>
                 <CardFooter>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        {isPending ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

function ImageUploadField({ name, label, image, currentImageUrl, register }: { name: "logo" | "seal"; label: string, image?: ImagePlaceholder, currentImageUrl?: string, register: any }) {
    const defaultImageUrl = currentImageUrl || image?.imageUrl;
    const imageHint = image?.imageHint || 'image';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(defaultImageUrl);
    
    const { ref, ...rest } = register(name, {
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e),
    });

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-full sm:w-1/3">
                <Label className="text-base font-medium">{label}</Label>
                <p className="text-sm text-muted-foreground mt-1">Sube una imagen para tu {label.toLowerCase()}.</p>
            </div>
            <div className="w-full sm:w-2/3 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="w-48 h-24 relative rounded-md border border-dashed flex items-center justify-center bg-muted/50 p-2">
                    {previewUrl ? (
                        <Image 
                          src={previewUrl} 
                          alt={label} 
                          fill 
                          className="object-contain" 
                          data-ai-hint={imageHint} 
                          sizes="12rem"
                        />
                    ) : (
                        <span className="text-xs text-muted-foreground">Sin imagen</span>
                    )}
                </div>
                <input
                    type="file"
                    id={name}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    {...rest}
                    ref={(e) => {
                      ref(e)
                      fileInputRef.current = e
                    }}
                />
                <Button variant="outline" type="button" onClick={handleButtonClick}>
                    <Upload className="mr-2" /> Cambiar
                </Button>
            </div>
        </div>
    );
}
