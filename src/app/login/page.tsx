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
  // Obtenemos las instancias de Auth y Firestore del contexto de Firebase.
  const auth = useAuth();
  const firestore = useFirestore();
  const [testStatus, setTestStatus] = useState('Pendiente');

  useEffect(() => {
    // Esta función asíncrona contiene toda la lógica de la prueba.
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
          throw new Error(`Error del servidor al obtener token: ${errorData.error || response.statusText}`);
        }

        const { token } = await response.json();
        console.log('Paso 1: Token recibido con éxito.', { token: token.substring(0, 30) + '...' });

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
        console.log(`Paso 3: Intentando leer documento en Firestore en la ruta: ${docRef.path}`);
        
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log('Paso 3: ¡ÉXITO! Documento leído correctamente:', docSnap.data());
          alert(`¡Flujo completo exitoso! Documento de '${user.uid}' leído. Revisa la consola para ver los detalles.`);
          setTestStatus('Éxito');
        } else {
          console.warn('Paso 3: Lectura completada, pero el documento no existe en Firestore.');
          alert(`Login exitoso, pero el documento /users/${user.uid} no existe en Firestore.`);
          setTestStatus('Doc no encontrado');
        }

      } catch (error: any) {
        console.error("--- ERROR EN EL FLUJO DE PRUEBA ---", error);
        setTestStatus('Error en flujo');
        
        if (error.name === 'FirebaseError') {
            if (error.code === 'permission-denied' || error.code?.includes('permission-denied')) {
                 console.error("Detalle del Error: La lectura fue denegada por las reglas de seguridad de Firestore. Verifica que el UID del usuario autenticado coincida con el del documento y que las reglas lo permitan.");
                 alert(`Error de Firebase: Permiso denegado (Missing or insufficient permissions).\n\nRevisa la consola para más detalles.`);
            } else {
              alert(`Error de Firebase: ${error.code}\n\nMira la consola para más detalles.`);
            }
        } else {
            alert(`Error en el flujo: ${error.message}\n\nMira la consola para más detalles.`);
        }
      }
    };

    // Ejecutamos la prueba solo si los servicios están disponibles.
    if(auth && firestore){
        runTest();
    }
  // La dependencia [auth, firestore] asegura que se ejecute cuando los servicios estén listos.
  // El array vacío [] haría que se ejecute potencialmente antes de que estén disponibles.
  }, [auth, firestore]);

  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-center text-sm text-muted-foreground mb-2">Zona de depuración</p>
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
