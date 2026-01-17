export default function PrintRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        style={{
          background: '#fff', // White background for printing
        }}
      >
        {children}
      </body>
    </html>
  );
}
