'use client';

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import Image from 'next/image';

interface SignaturePadProps {
  value?: string;
  onChange: (value: string) => void;
}

// This is the handle that will be exposed to the parent component.
export type SignaturePadHandle = {
  getSignatureData: () => string | null;
};

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ value, onChange }, ref) => {
    const sigPadRef = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Track if the user has drawn anything on the canvas since it was last cleared/loaded.
    const [hasBeenDrawnOn, setHasBeenDrawnOn] = useState(false);

    // Expose a method to the parent component to get the signature data URL.
    useImperativeHandle(ref, () => ({
      getSignatureData: () => {
        if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
          return sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
        }
        return null; // Return null if the canvas is empty.
      },
    }));

    // Effect to handle canvas resizing.
    useEffect(() => {
      const handleResize = () => {
          if(sigPadRef.current && containerRef.current){
              const canvas: any = sigPadRef.current.getCanvas();
              canvas.width = containerRef.current.offsetWidth;
          }
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial resize
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const clear = () => {
      sigPadRef.current?.clear();
      onChange(''); // Notify the form that the value has been cleared.
      setHasBeenDrawnOn(false);
    };
    
    // This handler now only tracks that a stroke has been made.
    // It does NOT call onChange, allowing for multiple strokes.
    const handleDrawEnd = () => {
        setHasBeenDrawnOn(true);
    };

    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div ref={containerRef} className="w-full max-w-sm rounded-md border border-input bg-background">
              <SignatureCanvas
                ref={sigPadRef}
                penColor='black'
                canvasProps={{
                  height: 150,
                  className: 'sigCanvas rounded-md w-full',
                }}
                onEnd={handleDrawEnd} // Use the new handler.
              />
          </div>
          {value && ( // Show the previously saved signature.
              <div className="hidden sm:flex flex-col items-center gap-2">
                  <p className="text-xs text-muted-foreground">Firma Actual</p>
                  <div className="w-32 h-16 rounded-md border p-1 flex items-center justify-center bg-muted/50">
                      <Image src={value} alt="Firma actual" width={120} height={60} className="object-contain" />
                  </div>
              </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={clear} disabled={!hasBeenDrawnOn && !value}>
            <Eraser className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
