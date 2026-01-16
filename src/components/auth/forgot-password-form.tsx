'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, Mail, Loader2 } from 'lucide-react';


export function ForgotPasswordForm() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!auth) {
        setError("Servicio de autenticación no disponible. Inténtalo de nuevo más tarde.");
        setLoading(false);
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        // If the call succeeds, or if the user is not found, we show the success message.
        // This is a security measure to prevent email enumeration.
        setSuccess(true);
    } catch (e: any) {
        // We still show success for 'auth/user-not-found' to prevent attackers from discovering registered emails.
        if (e.code === 'auth/user-not-found') {
             setSuccess(true);
        } else if (e.code === 'auth/invalid-email') {
            // But if the email format is wrong, we should tell the user.
            setError('La dirección de email no es válida. Por favor, revísala.');
        } else {
            // For any other error (like network issues), we show a generic message.
            setError(`Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.`);
            console.error("Password Reset Error:", e); // Log the actual error for debugging
        }
    } finally {
        setLoading(false);
    }
  };

  if (success) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Revisa tu Email</CardTitle>
                <CardDescription>
                    Si tu cuenta existe, hemos enviado un enlace a tu correo para restablecer tu contraseña.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
            </CardContent>
             <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/login">Volver a Iniciar Sesión</Link>
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="tu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
          </div>
           {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Mail className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Enviando...' : 'Enviar Enlace'}
            </Button>
           <p className="text-sm text-center text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Volver a Iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}
