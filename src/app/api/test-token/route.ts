import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-server';

/**
 * Endpoint de API para generar un token de autenticación personalizado para depuración.
 * Este endpoint es solo para desarrollo y pruebas.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Define un UID de usuario fijo para las pruebas.
    const testUid = "test-uid";
    console.log(`Backend: Creando token personalizado para UID: ${testUid}`);
    
    // 2. Genera el token personalizado usando el SDK de Firebase Admin.
    // Este token permite a un cliente autenticarse como el usuario con el UID especificado.
    const customToken = await adminAuth().createCustomToken(testUid);
    
    console.log("Backend: Token personalizado creado con éxito.");
    
    // 3. Devuelve el token al frontend en formato JSON.
    return NextResponse.json({ token: customToken });

  } catch (error) {
    // Si la creación del token falla (ej. problemas de configuración del Admin SDK),
    // se captura el error y se devuelve una respuesta 500.
    console.error("Backend: Error creando token personalizado:", error);
    return NextResponse.json({ error: 'No se pudo crear el token personalizado.' }, { status: 500 });
  }
}
