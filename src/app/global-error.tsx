'use client'

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle className="text-destructive">Ha ocurrido un error en la aplicación</CardTitle>
              <CardDescription>
                Lo sentimos, algo no ha funcionado como se esperaba.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Puedes intentar recargar la página. Si el problema persiste, por favor, contacta con el soporte.
              </p>
              {error?.message && (
                <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
                  Detalles del error: {error.message}
                </pre>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => reset()} className="w-full">
                Recargar página
              </Button>
            </CardFooter>
          </Card>
        </main>
      </body>
    </html>
  )
}
