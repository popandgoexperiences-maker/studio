'use client';

import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import Image from 'next/image';

interface SignaturePadProps {
  value?: string;
  onChange: (value: string) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    setIsEmpty(!value);
    // Resize canvas to fit container
    const handleResize = () => {
        if(sigPadRef.current && containerRef.current){
            const canvas: any = sigPadRef.current.getCanvas();
            canvas.width = containerRef.current.offsetWidth;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize
    return () => window.removeEventListener('resize', handleResize);
  }, [value]);

  const clear = () => {
    sigPadRef.current?.clear();
    onChange('');
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (sigPadRef.current) {
      if (sigPadRef.current.isEmpty()) {
        onChange('');
        setIsEmpty(true);
      } else {
        const dataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
        onChange(dataUrl);
        setIsEmpty(false);
      }
    }
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
              onEnd={handleEnd}
            />
        </div>
        {value && (
            <div className="hidden sm:flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">Firma Actual</p>
                <div className="w-32 h-16 rounded-md border p-1 flex items-center justify-center bg-muted/50">
                    <Image src={value} alt="Firma actual" width={120} height={60} className="object-contain" />
                </div>
            </div>
        )}
       </div>
      <div className="flex gap-2">
        <Button variant="outline" type="button" onClick={clear} disabled={isEmpty}>
          <Eraser className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      </div>
    </div>
  );
}
