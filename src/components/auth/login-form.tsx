'use client';
// Indica que este componente se ejecuta en el cliente.
// Necesario porque usa hooks como useState, useForm, useRouter, etc.

import React from 'react';
// Importa React para usar hooks como useState.

import Link from 'next/link';
// Componente de Next.js para navegación interna sin recargar la página.

import { useForm, type SubmitHandler } from 'react-hook-form';
// useForm → gestiona formularios de forma eficiente.
// SubmitHandler → tipo para funciones de envío.

import { zodResolver } from '@hookform/resolvers/zod';
// Permite usar Zod como validador dentro de react-hook-form.

import { z } from 'zod';
// Librería de validación de esquemas.

import { useRouter } from 'next/navigation';
// Hook de Next.js para redirigir al usuario desde un componente cliente.

import { useAuth } from '@/firebase';
// Hook personalizado que devuelve la instancia de Firebase Auth.

import { signInWithEmailAndPassword } from 'firebase/auth';
// Función de Firebase para iniciar sesión con email y contraseña.

import { Button } from '@/components/ui/button';
// Componente de botón de ShadCN UI.

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// Componentes de tarjeta de ShadCN UI.

import { Input } from '@/components/ui/input';
// Input estilizado.

import { Label } from '@/components/ui/label';
// Etiqueta accesible para inputs.

import { AlertCircle, LogIn, Loader2 } from 'lucide-react';
// Iconos SVG.

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
// Componente de alerta para mostrar errores.


// ————————————————————————————————————————————————
// Esquema de validación con Zod
// Define cómo debe ser el formulario y qué errores mostrar.
// ————————————————————————————————————————————————
const LoginSchema = z.object({
  email: z.string().email('Por favor, introduce un email válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

// Tipo TypeScript generado automáticamente a partir del esquema.
type LoginValues = z.infer<typeof LoginSchema>;


// ————————————————————————————————————————————————
// Componente principal: LoginForm
// Renderiza el formulario y gestiona el inicio de sesión.
// ————————————————————————————————————————————————
export function LoginForm() {

  // Estado para mostrar el spinner y deshabilitar el botón.
  const [loading, setLoading] = React.useState(false);

  // Estado para mostrar errores del servidor (Firebase o API).
  const [serverError, setServerError] = React.useState<string | null>(null);

  // Instancia de Firebase Auth.
  const auth = useAuth();

  // Router para redirigir después del login.
  const router = useRouter();


  // ————————————————————————————————————————————————
  // Configuración del formulario con react-hook-form
  // Incluye validación automática con Zod.
  // ————————————————————————————————————————————————
  const {
    register,        // Registra inputs para que react-hook-form los controle.
    handleSubmit,    // Maneja el envío del formulario.
    formState: { errors }, // Contiene errores de validación.
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema), // Usa Zod como validador.
  });


  // ————————————————————————————————————————————————
  // Función: onSubmit
  // Se ejecuta cuando el usuario envía el formulario.
  // Flujo:
  // 1. Limpia errores previos y activa loading
  // 2. Valida que Auth esté disponible
  // 3. Inicia sesión en Firebase
  // 4. Obtiene el ID token del usuario
  // 5. Lo envía al servidor para crear una sesión HTTP-only
  // 6. Redirige al panel
  // 7. Maneja errores
  // ————————————————————————————————————————————————
  const onSubmit: SubmitHandler<LoginValues> = async (data) => {
    setLoading(true);
    setServerError(null);

    try {
      // Si Firebase Auth no está listo, abortamos.
      if (!auth) {
        throw new Error("El servicio de autenticación no está disponible.");
      }

      // 1. Iniciar sesión en Firebase (cliente)
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Obtener el ID token del usuario autenticado
      const idToken = await user.getIdToken();

      // 3. Enviar token al servidor para crear cookie de sesión segura
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      // Si el servidor devuelve error, lo mostramos.
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo crear la sesión en el servidor.');
      }

      // 4. Redirigir solo cuando la sesión está creada
      router.push('/invoices');

    } catch (e: any) {
      // Errores comunes de Firebase
      if (
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password'
      ) {
        setServerError('Credenciales incorrectas. Por favor, revisa tu email y contraseña.');
      } else {
        // Otros errores inesperados
        setServerError(`Ha ocurrido un error inesperado: ${e.message}`);
      }

      setLoading(false);
    }
  };


  // ————————————————————————————————————————————————
  // Render del formulario
  // ————————————————————————————————————————————————
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Introduce tu email y contraseña para acceder a tu panel.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Campo: email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
            />
            {/* Error de validación */}
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Campo: contraseña */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/forgot-password" className="ml-auto inline-block text-sm text-primary hover:underline">
                ¿Has olvidado la contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {/* Error de validación */}
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Error del servidor (Firebase o API) */}
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de inicio de sesión</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">

          {/* Botón de enviar */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>

          {/* Enlace a registro */}
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Regístrate
            </Link>
          </p>

        </CardFooter>
      </Card>
    </form>
  );
}
