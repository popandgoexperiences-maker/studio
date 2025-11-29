import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-server';

export async function GET(request: NextRequest) {
  try {
    const testUid = "test-uid";
    console.log(`Intentando crear token personalizado para UID: ${testUid}`);
    
    const customToken = await adminAuth.createCustomToken(testUid);
    
    console.log("Token personalizado creado con éxito.");
    
    return NextResponse.json({ token: customToken });

  } catch (error) {
    console.error("Error creando token personalizado:", error);
    return NextResponse.json({ error: 'No se pudo crear el token personalizado.' }, { status: 500 });
  }
}
