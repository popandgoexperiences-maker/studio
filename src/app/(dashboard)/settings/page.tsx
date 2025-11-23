'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import { fetchUser } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { User } from '@/lib/definitions';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
    const { user: authUser, isUserLoading } = useUser();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(authUser) {
            async function loadUser() {
                try {
                    const userData = await fetchUser(authUser!.uid);
                    setUser(userData);
                } catch (error) {
                    console.error("Failed to fetch user settings:", error);
                } finally {
                    setLoading(false);
                }
            }
            loadUser();
        }
    }, [authUser]);
    
    const logo = PlaceHolderImages.find(img => img.id === 'default-logo');
    const seal = PlaceHolderImages.find(img => img.id === 'default-seal');

    const showLoading = isUserLoading || loading;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <PageHeader
                title="Configuración"
                description="Gestiona la información de tu empresa y tus datos personales."
            />
            {showLoading ? (
                <div className="space-y-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            ) : user && (
                <SettingsForm user={user} images={{ logo, seal }} />
            )}
        </div>
    );
}
