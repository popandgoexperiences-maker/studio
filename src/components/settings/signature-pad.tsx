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

export type SignaturePadHandle = {
  getSignatureData: () => string | null;
};

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ value, onChange }, ref) => {
    const sigPadRef = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasBeenDrawnOn, setHasBeenDrawnOn] = useState(false);

    useImperativeHandle(ref, () => ({
      getSignatureData: () => {
        if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
          // Get the signature canvas with a transparent background
          const signatureCanvas = sigPadRef.current.getTrimmedCanvas();
          
          // Create a new canvas to draw a white background
          const backgroundCanvas = document.createElement('canvas');
          backgroundCanvas.width = signatureCanvas.width;
          backgroundCanvas.height = signatureCanvas.height;
          
          const ctx = backgroundCanvas.getContext('2d');
          if (!ctx) {
            // Fallback or error handling if context is not available
            return sigPadRef.current.toDataURL('image/png');
          }
          
          // Fill the background with white
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
          
          // Draw the signature (with its transparent background) over the white background
          ctx.drawImage(signatureCanvas, 0, 0);
          
          // Return the new canvas as a JPEG, which is much smaller than PNG
          return backgroundCanvas.toDataURL('image/jpeg', 0.8);
        }
        return null;
      },
    }));

    useEffect(() => {
      const handleResize = () => {
          if(sigPadRef.current && containerRef.current){
              const canvas: any = sigPadRef.current.getCanvas();
              const ratio = Math.max(window.devicePixelRatio || 1, 1);
              canvas.width = containerRef.current.offsetWidth * ratio;
              canvas.height = containerRef.current.offsetHeight * ratio;
              canvas.getContext("2d").scale(ratio, ratio);
              // Redraw the signature if it exists
              const data = sigPadRef.current.toDataURL();
              sigPadRef.current.fromDataURL(data);
          }
      };
      // A small delay to ensure the container has its final dimensions
      const timeoutId = setTimeout(handleResize, 100);
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    const clear = () => {
      sigPadRef.current?.clear();
      onChange('');
      setHasBeenDrawnOn(false);
    };
    
    const handleDrawEnd = () => {
        setHasBeenDrawnOn(true);
    };

    return (
      <div className="flex flex-col gap-4 w-full h-full">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full h-full">
          <div ref={containerRef} className="w-full h-full max-w-sm rounded-md border border-input bg-background">
              <SignatureCanvas
                ref={sigPadRef}
                penColor='black'
                canvasProps={{
                  className: 'sigCanvas rounded-md w-full h-full',
                }}
                onEnd={handleDrawEnd}
              />
          </div>
          {value && !hasBeenDrawnOn && (
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
