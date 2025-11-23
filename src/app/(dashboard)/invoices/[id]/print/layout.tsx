import React from 'react';

// This layout replaces the default dashboard layout for the print page.
// It renders its children directly, without any extra HTML structure,
// to allow the print page to be a self-contained document.
export default function InvoicePrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
