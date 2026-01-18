'use client';

import { useEffect, useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Componente de prueba para depurar el flujo completo de autenticación
 * con token personalizado y lectura de datos en Firestore.
 * Ejecuta la prueba automáticamente al montar.
 */
function CustomLoginTester() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [testStatus, setTestStatus] = useState('Pendiente');

  useEffect(() => {
    const runTest = async () => {
      if (!auth || !firestore) {
        console.error('Error en Test: Servicios de Auth o Firestore no disponibles.');
        alert('Error: Servicios de Firebase no disponibles en el cliente.');
        setTestStatus('Error en servicios');
        return;
      }

      try {
        setTestStatus('Ejecutando...');

        // --- PASO 1: Obtener token del backend ---
        console.log('Paso 1: Solicitando token personalizado del endpoint /api/test-token...');
        const response = await fetch('/api/test-token');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Error del servidor al obtener token: ${errorData.error || response.statusText}`
          );
        }

        const { token } = await response.json();
        console.log('Paso 1: Token recibido con éxito.', {
          token: token.substring(0, 30) + '...',
        });

        // --- PASO 2: Iniciar sesión en el frontend ---
        console.log('Paso 2: Intentando iniciar sesión con signInWithCustomToken...');
        const userCredential = await signInWithCustomToken(auth, token);
        const user = userCredential.user;

        if (!user || user.uid !== 'test-uid') {
          throw new Error('El inicio de sesión no devolvió el usuario esperado.');
        }

        console.log('Paso 2: Login OK. Usuario autenticado con UID:', user.uid);

        // --- PASO 3: Leer documento de Firestore ---
        const docPath = `users/${user.uid}`;
        const docRef = doc(firestore, docPath);

        console.log(
          `Paso 3: Intentando leer documento en Firestore en la ruta: ${docRef.path}`
        );

        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error(`El documento ${docRef.path} no existe en Firestore.`);
        }

        console.log('Paso 3: Documento leído correctamente:', docSnap.data());
        setTestStatus('OK');
      } catch (err: any) {
        // Manejo de errores específicos de Firebase
        if (err?.name === 'FirebaseError') {
          if (err.code === 'permission-denied') {
            console.error('Permiso denegado al leer Firestore.');
            alert(
              `Error de Firebase: Permiso denegado.\n\nCausas comunes:\n1. Reglas de Firestore no permiten la lectura.\n2. UID del usuario no coincide.\n\nUID actual: ${auth.currentUser?.uid}`
            );
          } else {
            alert(
              `Error de Firebase: ${err.code}\n\nMira la consola para más detalles.`
            );
          }
        } else {
          alert(
            `Error en el flujo: ${err.message}\n\nMira la consola para más detalles.`
          );
        }

        setTestStatus('Error');
      }
    };

    if (auth && firestore) {
      runTest();
    }
  }, [auth, firestore]);

  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-center text-sm text-muted-foreground mb-2">
        Zona de depuración
      </p>
      <Button variant="outline" className="w-full" disabled>
        Prueba automática: {testStatus}
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

        {/* Componente de prueba añadido al final de la página de login */}
        <CustomLoginTester />
      </div>
    </main>
  );
}