'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

// Helper para asegurar la inicialización de admin
function ensureAdminInitialized() {
  if (!admin.apps.length) {
    console.log("Session Route: Initializing Firebase Admin SDK...");
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        console.warn("Session Route: Firebase Admin env variables not set.");
    }
  }
  return getAuth();
}


export async function POST(request: NextRequest) {
  try {
    const adminAuth = ensureAdminInitialized();
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // Verificar el idToken para asegurarse de que es válido.
    await adminAuth.verifyIdToken(idToken);

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días

    // Crear la cookie de sesión.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: 'success' });

    // Configuración de la cookie para entornos sandboxed (iframes, cross-site)
    // Esto es CRUCIAL para que Firebase Studio funcione correctamente.
    response.cookies.set({
      name: 'session',
      value: sessionCookie,
      httpOnly: true,
      secure: true, // Requerido para SameSite=None
      maxAge: expiresIn / 1000,
      path: '/',
      sameSite: 'none', // Permite que la cookie se envíe en contextos cross-site
    });

    return response;

  } catch (error) {
    console.error('Session creation failed:', error);
    return NextResponse.json({ error: 'Session creation failed' }, { status: 401 });
  }
}
