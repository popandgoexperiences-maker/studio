import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-server';

// Renombrado a /api/test-token en el siguiente cambio para alinearse con las solicitudes.
// Por ahora, lo mantenemos como custom-token. El siguiente cambio lo renombrará.

export async function GET(request: NextRequest) {
  try {
    // UID fijo para el usuario de prueba.
    const testUid = "test-uid";
    console.log(`Backend: Creando token personalizado para UID: ${testUid}`);
    
    // Genera el token personalizado usando Firebase Admin.
    const customToken = await adminAuth().createCustomToken(testUid);
    
    console.log("Backend: Token personalizado creado con éxito.");
    
    // Devuelve el token al frontend en formato JSON.
    return NextResponse.json({ token: customToken });

  } catch (error) {
    console.error("Backend: Error creando token personalizado:", error);
    return NextResponse.json({ error: 'No se pudo crear el token personalizado.' }, { status: 500 });
  }
}
