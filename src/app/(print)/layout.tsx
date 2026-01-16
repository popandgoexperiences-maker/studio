export default function PrintRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#fff',

          // ⭐ elimina nodos invisibles y saltos de línea
          fontSize: 0,
          lineHeight: 1,

          // ⭐ evita que Chrome imprima contenido fuera del contenedor
          overflow: 'hidden',

          // ⭐ evita que el body mida más de lo necesario
          boxSizing: 'border-box',
        }}
      >
        {/* ⭐ wrapper que restaura el tamaño normal del contenido */}
        <div
          style={{
            fontSize: '12px',
            lineHeight: 'normal',
            width: '100%',
            height: '100%',
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}