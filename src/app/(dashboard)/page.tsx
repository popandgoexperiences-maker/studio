'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/invoices');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p>Cargando panel...</p>
        </div>
    );
}
