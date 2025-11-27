'use client';
import { PageHeader } from '@/components/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { User } from '@/lib/definitions';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';

export default function SettingsPage() {
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const firestore = useFirestore();

    const userRef = useMemoFirebase(
        () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    
    const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);
    
    const logo = PlaceHolderImages.find(img => img.id === 'default-logo');
    const seal = PlaceHolderImages.find(img => img.id === 'default-seal');

    const showLoading = isAuthUserLoading || isUserLoading;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
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
