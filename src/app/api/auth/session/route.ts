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

    // **PASO OBLIGATORIO**
    await adminAuth.verifyIdToken(idToken);

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: 'success' });

    response.cookies.set({
      name: 'session',
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000,
      path: '/',
      sameSite: 'strict'
    });

    return response;

  } catch (error) {
    console.error('Session creation failed:', error);
    return NextResponse.json({ error: 'Session creation failed' }, { status: 401 });
  }
}
