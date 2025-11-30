
import { NextResponse } from "next/server";
import { getAuthSafe } from "@/lib/firebase-server";

export async function GET() {
  const out: Record<string, any> = {
    customTokenCreated: false,
    idTokenExchanged: false,
    idTokenMasked: null,
    verifyUid: null,
    sessionCookieCreated: false,
    sessionEndpointStatus: null,
    sessionEndpointBody: null,
    sessionEndpointSetCookie: null,
    error: null,
  };

  try {
    const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error("Missing FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_API_KEY in environment");

    // 1) Crear custom token para test-uid
    const customToken = await getAuthSafe().createCustomToken("test-uid");
    out.customTokenCreated = !!customToken;

    // 2) Intercambiar customToken por idToken usando Identity Toolkit REST API
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true })
      }
    );

    const signInJson = await signInRes.json();
    if (!signInRes.ok) {
      throw new Error("signInWithCustomToken failed: " + JSON.stringify(signInJson));
    }

    const idToken = signInJson.idToken;
    out.idTokenExchanged = !!idToken;
    // no devuelvas el idToken completo, solo máscara los últimos 4 caracteres para diagnóstico
    out.idTokenMasked = idToken ? (`***${idToken.slice(-4)}`) : null;

    // 3) Verificar idToken en Admin
    const decoded = await getAuthSafe().verifyIdToken(idToken);
    out.verifyUid = decoded?.uid ?? null;

    // 4) Crear session cookie (opcional del propio admin)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días
    const sessionCookie = await getAuthSafe().createSessionCookie(idToken, { expiresIn });
    out.sessionCookieCreated = !!sessionCookie;

    // 5) Llamar al endpoint /api/auth/session del servidor para comprobar Set-Cookie y respuesta
    const serverUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const sessionRes = await fetch(`${serverUrl.replace(/\/+$/,"")}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    out.sessionEndpointStatus = sessionRes.status;
    // texto plano porque puede venir HTML o JSON
    out.sessionEndpointBody = await sessionRes.text();
    out.sessionEndpointSetCookie = sessionRes.headers.get("set-cookie");

    return NextResponse.json(out);
  } catch (err: any) {
    out.error = err?.message ?? String(err);
    return NextResponse.json(out, { status: 500 });
  }
}
