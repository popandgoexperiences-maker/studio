'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignaturePad, type SignaturePadHandle } from '@/components/settings/signature-pad';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function SignaturePage() {
    const router = useRouter();
    const signaturePadRef = useRef<SignaturePadHandle>(null);
    const isMobile = useIsMobile();
    
    // We need to ensure we only check for mobile status on the client,
    // after the component has mounted, to avoid hydration errors and premature redirects.
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Only perform the redirect check after we are sure we're on the client
        // and the isMobile hook has had a chance to run correctly.
        if (isClient && !isMobile) {
            router.replace('/settings');
        }
    }, [isClient, isMobile, router]);


    const handleSave = () => {
        const signatureData = signaturePadRef.current?.getSignatureData();
        // Use localStorage to pass the data back to the settings page.
        // Save even if it's null/empty, to handle clearing the signature.
        localStorage.setItem('newSignature', signatureData || '');
        router.back();
    };
    
    // While hydrating or if we are on desktop (and about to redirect), render nothing.
    // This prevents a flash of content and ensures the redirect logic runs cleanly.
    if (!isClient || !isMobile) {
        return null; 
    }

    return (
        <div className="fixed inset-0 z-50 flex h-full w-full flex-col bg-background">
            <header className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Dibuja tu firma</h1>
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <X />
                    <span className="sr-only">Cerrar</span>
                </Button>
            </header>
            <main className="flex-grow p-4">
                <div className="w-full h-full rounded-lg border bg-white">
                    <SignaturePad ref={signaturePadRef} onChange={() => {}} />
                </div>
            </main>
            <footer className="p-4 border-t bg-background">
                <Button className="w-full" size="lg" onClick={handleSave}>
                    <Save className="mr-2" />
                    Guardar Firma
                </Button>
            </footer>
        </div>
    );
}
