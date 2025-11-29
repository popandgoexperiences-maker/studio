'use client';

import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';

function CustomLoginTester() {
  const auth = useAuth();

  const handleCustomLogin = async () => {
    if (!auth) {
      console.error('Error en login: Servicio de autenticación no disponible.');
      return;
    }
    try {
      console.log('Solicitando token personalizado...');
      const response = await fetch('/api/auth/custom-token');
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }
      const { token } = await response.json();
      console.log('Token recibido. Intentando iniciar sesión...');

      await signInWithCustomToken(auth, token);
      
      console.log("Login OK");
      alert("¡Inicio de sesión con token personalizado exitoso!");
      // Opcional: Redirigir al usuario
      // window.location.href = '/invoices';

    } catch (error: any) {
      console.error("Error en login:", error.message);
      alert(`Error en el inicio de sesión personalizado: ${error.message}`);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-center text-sm text-muted-foreground mb-2">Zona de depuración</p>
      <Button variant="outline" className="w-full" onClick={handleCustomLogin}>
        Probar Login con Token Personalizado
      </Button>
    </div>
  );
}


export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <LoginForm />
        <CustomLoginTester />
      </div>
    </main>
  );
}
