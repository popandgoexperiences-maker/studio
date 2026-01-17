'use client';

import { useEffect } from 'react';
import { uploadFile } from '@/lib/actions';

export const dynamic = "force-dynamic";
export default function AuthWorkerPage() {
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // IMPORTANT: Validate the origin of the message
      if (event.origin !== window.location.origin) {
        console.warn('Ignored message from different origin:', event.origin);
        return;
      }

      const { command, payload } = event.data;

      if (command === 'upload-file' && payload) {
        const { file, fieldName } = payload;
        if (file instanceof File && typeof fieldName === 'string') {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fieldName', fieldName);

          try {
            const result = await uploadFile(formData);
            if (result.success) {
              // Send success message back to the parent window
              window.parent.postMessage({ type: 'upload-success', fieldName, url: result.url }, window.location.origin);
            } else {
              throw new Error(result.error || 'Unknown upload error');
            }
          } catch (error: any) {
            // Send error message back to the parent window
            window.parent.postMessage({ type: 'upload-error', fieldName, error: error.message }, window.location.origin);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Signal that the iframe is ready to receive messages
    window.parent.postMessage({ type: 'iframe-ready' }, window.location.origin);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // This page is not meant to be visible
  return null;
}

    