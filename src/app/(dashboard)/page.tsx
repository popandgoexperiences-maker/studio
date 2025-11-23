'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function DashboardRootPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading) {
            if (user) {
                router.replace('/invoices');
            } else {
                router.replace('/login');
            }
        }
    }, [user, isUserLoading, router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p>Cargando panel...</p>
        </div>
    );
}