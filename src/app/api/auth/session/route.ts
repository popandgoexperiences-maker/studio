import { type NextRequest, NextResponse } from 'next/server';
import { getAuthSafe } from '@/lib/firebase-server';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthSafe();
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // Verificar el idToken para asegurarse de que es válido.
    // Esto es manejado implícitamente por createSessionCookie en la mayoría de los casos,
    // pero una verificación explícita puede ser útil para la depuración.
    // const decodedToken = await auth.verifyIdToken(idToken);

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días

    // Crear la cookie de sesión.
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: 'success' });

    // Configuración de la cookie para entornos sandboxed (iframes, cross-site)
    // Esto es CRUCIAL para que Firebase Studio funcione correctamente.
    response.cookies.set("__session", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 5, // 5 días
    });

    return response;

  } catch (error) {
    console.error('Session creation failed:', error);
    return NextResponse.json({ error: 'Session creation failed' }, { status: 401 });
  }
}
