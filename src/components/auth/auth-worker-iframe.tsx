'use client';

import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useRef } from 'react';

// A global reference to the iframe element
let iframeRef: HTMLIFrameElement | null = null;
let isIframeReady = false;
let pendingMessages: any[] = [];

// Function to send a command to the iframe
export const sendCommandToWorker = (command: string, payload: any) => {
  if (isIframeReady && iframeRef && iframeRef.contentWindow) {
    iframeRef.contentWindow.postMessage({ command, payload }, window.location.origin);
  } else {
    // If the iframe is not ready, queue the message
    pendingMessages.push({ command, payload });
  }
};


export const AuthWorkerIframe = () => {
  const { toast } = useToast();
  const internalRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Assign the ref to the global variable
    iframeRef = internalRef.current;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      
      const { type, fieldName, error, url } = event.data;
      
      if (type === 'iframe-ready') {
        isIframeReady = true;
        // Send any pending messages
        pendingMessages.forEach(msg => sendCommandToWorker(msg.command, msg.payload));
        pendingMessages = [];
      } else if (type === 'upload-success') {
        toast({
          title: 'Subida Exitosa',
          description: `La imagen para ${fieldName} se ha guardado.`,
        });
        // Optionally, trigger a state update here to refresh the UI with the new URL
      } else if (type === 'upload-error') {
        toast({
          variant: 'destructive',
          title: 'Error de Subida',
          description: `No se pudo subir la imagen para ${fieldName}: ${error}`,
        });
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      iframeRef = null;
      isIframeReady = false;
    };
  }, [toast]);

  return (
    <iframe
      ref={internalRef}
      src="/auth-worker"
      style={{ display: 'none' }}
      sandbox="allow-same-origin allow-scripts allow-forms"
      title="Authentication Worker"
    />
  );
};

    