import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'InvoiceFlow',
  description: 'Simple and professional invoicing for freelancers and small businesses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans font-body antialiased'
        )}
      >
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}