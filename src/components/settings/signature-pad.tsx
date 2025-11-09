'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import Image from 'next/image';

interface SignaturePadProps {
  name: string;
  currentImageUrl?: string;
}

export function SignaturePad({ name, currentImageUrl }: SignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [signatureData, setSignatureData] = useState<string | undefined>(currentImageUrl);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    sigPadRef.current?.clear();
    setSignatureData(undefined);
    if(hiddenInputRef.current) {
        hiddenInputRef.current.value = '';
    }
  };

  const handleEnd = () => {
    const dataUrl = sigPadRef.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl && hiddenInputRef.current) {
      hiddenInputRef.current.value = dataUrl;
      setSignatureData(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4">
       <input type="hidden" name={name} ref={hiddenInputRef} defaultValue={currentImageUrl} />
       <div className="w-full max-w-sm rounded-md border border-input bg-background">
        {signatureData && !sigPadRef.current?.isEmpty() ? (
          <Image src={signatureData} alt="Firma actual" width={400} height={150} className="object-contain rounded-md" />
        ) : (
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
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" type="button" onClick={clear}>
          <Eraser className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      </div>
    </div>
  );
}
