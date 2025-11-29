import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-server';
import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This is a temporary app for the idToken exchange simulation
const E2E_TEST_APP_NAME = 'e2e-test-app';

async function getTestApp() {
  const apps = getApps();
  const existingApp = apps.find(app => app?.name === E2E_TEST_APP_NAME);
  if (existingApp) {
    return existingApp;
  }
  
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  return initializeApp({
    credential: admin.credential.cert(serviceAccount)
  }, E2E_TEST_APP_NAME);
}


/**
 * Endpoint para realizar una prueba E2E del flujo de autenticación completo.
 */
export async function GET(request: NextRequest) {
  const result = {
    testTokenEndpoint: { status: 0, body: {} as any },
    signInSimulation: { status: "fail", uid: null as string | null, error: null as string | null, idToken: null as string | null },
    sessionEndpoint: { status: 0, body: {} as any, setCookieHeader: null as string | null },
  };

  try {
    // 1. Simula la llamada a /api/test-token
    const testUid = "test-uid";
    const customToken = await adminAuth.createCustomToken(testUid);
    result.testTokenEndpoint = { status: 200, body: { token: customToken } };

    // 2. Simula signInWithCustomToken para obtener idToken
    // Esto requiere una librería de cliente de Firebase, pero podemos simularlo en el backend
    // usando un SDK de cliente o, más fácilmente, intercambiando el token.
    // Usaremos una app de admin temporal para autenticar.
    const testApp = await getTestApp();
    const testAppAuth = getAuth(testApp);

    // REST-based token exchange (requires client-side API key)
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (getApps()[0]?.options.apiKey);
    if (!apiKey) throw new Error("Firebase API Key is not configured for token exchange simulation.");

    const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });
    
    if (!signInResponse.ok) {
        const errorBody = await signInResponse.json();
        throw new Error(`Failed to exchange custom token for ID token: ${JSON.stringify(errorBody)}`);
    }

    const signInData = await signInResponse.json();
    const idToken = signInData.idToken;

    result.signInSimulation = { status: "ok", uid: testUid, error: null, idToken: idToken };

    // 3. Llama a /api/auth/session con el idToken
    const sessionResponse = await fetch(new URL('/api/auth/session', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    result.sessionEndpoint.status = sessionResponse.status;
    try {
        result.sessionEndpoint.body = await sessionResponse.json();
    } catch {
        result.sessionEndpoint.body = await sessionResponse.text();
    }
    result.sessionEndpoint.setCookieHeader = sessionResponse.headers.get('Set-Cookie');

  } catch (error: any) {
    // Captura errores en cualquier parte del flujo
    if (result.testTokenEndpoint.status === 0) {
        result.testTokenEndpoint = { status: 500, body: { error: error.message } };
    } else if (result.signInSimulation.status === 'fail') {
        result.signInSimulation.error = error.message;
    } else if (result.sessionEndpoint.status === 0) {
        result.sessionEndpoint = { status: 500, body: { error: error.message }, setCookieHeader: null };
    }
  } finally {
    // Limpia la app de prueba
    const testApp = getApps().find(app => app?.name === E2E_TEST_APP_NAME);
    if (testApp) {
      await deleteApp(testApp);
    }
  }

  // Por diseño, este endpoint de prueba no debe devolver logs de consola.
  // El JSON de resultado es la salida principal.
  return NextResponse.json(result);
}

// Re-export adminAuth para mantener consistencia con otros archivos.
import admin from "firebase-admin";
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e: any) {
        // Silenciar errores de inicialización si ya existe
    }
}
export { admin };
