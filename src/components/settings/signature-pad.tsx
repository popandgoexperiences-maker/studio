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
          const signatureCanvas = sigPadRef.current.getTrimmedCanvas();

          // 1. Define a maximum width for the signature image to control file size.
          const MAX_WIDTH = 400; // pixels

          // 2. Calculate new dimensions to maintain aspect ratio.
          let newWidth = signatureCanvas.width;
          let newHeight = signatureCanvas.height;

          if (newWidth > MAX_WIDTH) {
            const ratio = MAX_WIDTH / newWidth;
            newWidth = MAX_WIDTH;
            newHeight = newHeight * ratio;
          }

          // 3. Create a temporary canvas to resize the signature.
          const resizedCanvas = document.createElement('canvas');
          resizedCanvas.width = newWidth;
          resizedCanvas.height = newHeight;
          const resizedCtx = resizedCanvas.getContext('2d');
          if (!resizedCtx) {
            return sigPadRef.current.toDataURL('image/png'); // Fallback
          }
          
          // 4. Draw the original signature onto the smaller canvas.
          resizedCtx.drawImage(signatureCanvas, 0, 0, newWidth, newHeight);

          // 5. Create the final canvas that will have a white background.
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = newWidth;
          finalCanvas.height = newHeight;
          const finalCtx = finalCanvas.getContext('2d');
          if (!finalCtx) {
            return sigPadRef.current.toDataURL('image/png'); // Fallback
          }

          // 6. Fill the final canvas with a white background.
          finalCtx.fillStyle = 'white';
          finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

          // 7. Draw the resized signature image over the white background.
          finalCtx.drawImage(resizedCanvas, 0, 0);

          // 8. Return as a compressed JPEG. This is much smaller than PNG.
          return finalCanvas.toDataURL('image/jpeg', 0.7);
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
