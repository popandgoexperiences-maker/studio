'use client';
import { PageHeader } from '@/components/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { User } from '@/lib/definitions';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';

// --- DEBUG: Probar lectura básica ---
async function testDocRead(firestore: any) {
  if (!firestore) {
      console.error("TestRead: Instancia de Firestore no disponible.");
      return;
  }
  try {
    const ref = doc(firestore, "users", "test-uid");
    console.log("TestRead: Intentando leer el documento:", ref.path);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      console.log("TestRead: Documento leído con éxito:", snap.data());
    } else {
      console.log("TestRead: Documento no encontrado en la ruta:", ref.path);
    }
  } catch (e) {
    console.error("TestRead: Error leyendo documento:", e);
  }
}
// --- FIN DEBUG ---


export default function SettingsPage() {
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const firestore = useFirestore();

    // --- DEBUG: Ejecutar prueba de lectura al montar ---
    useEffect(() => {
        if (firestore) {
            testDocRead(firestore);
        }
    }, [firestore]);
    // --- FIN DEBUG ---

    const userRef = useMemoFirebase(
        () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );

    // --- DEBUG: Validar path y variables en useDoc ---
    if (userRef) {
        console.log("useDoc: Pasando la siguiente ruta al hook:", userRef.path);
    } else {
        console.log("useDoc: userRef es nulo. No se llamará al hook todavía.");
    }
    // --- FIN DEBUG ---
    
    const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);
    
    const logo = PlaceHolderImages.find(img => img.id === 'default-logo');
    const seal = PlaceHolderImages.find(img => img.id === 'default-seal');

    const showLoading = isAuthUserLoading || isUserLoading;

    return (
        <div>
            <PageHeader
                title="Configuración"
                description="Gestiona la información de tu empresa y tus datos personales."
            />
            {showLoading || !user ? (
                <div className="space-y-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            ) : (
                <SettingsForm user={user} images={{ logo, seal }} />
            )}
        </div>
    );
}
