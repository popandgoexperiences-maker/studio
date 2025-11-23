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
  const [isEmpty, setIsEmpty] = useState(true);

  // Set initial signature from prop value
  useEffect(() => {
    if (value && sigPadRef.current) {
        // We check if it's not empty to avoid overwriting a new signature with the old value on re-render
        if(sigPadRef.current.isEmpty()) {
            sigPadRef.current.fromDataURL(value, {
              width: 400,
              height: 150,
            });
        }
        setIsEmpty(false);
    }
  }, [value]);

  const clear = () => {
    sigPadRef.current?.clear();
    onChange('');
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (sigPadRef.current) {
      const dataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
      onChange(dataUrl);
      setIsEmpty(sigPadRef.current.isEmpty());
    }
  };

  return (
    <div className="flex flex-col gap-4">
       <div className="w-full max-w-sm rounded-md border border-input bg-background">
          <SignatureCanvas
            ref={sigPadRef}
            penColor='black'
            canvasProps={{
              width: 400,
              height: 150,
              className: 'sigCanvas rounded-md',
            }}
            onEnd={handleEnd}
          />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" type="button" onClick={clear} disabled={isEmpty && !value}>
          <Eraser className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      </div>
    </div>
  );
}
