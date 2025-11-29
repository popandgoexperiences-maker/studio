import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-server";

export async function GET() {
  const response: Record<string, any> = {
    tokenCreated: null,
    idTokenVerified: null,
    sessionResult: null,
    setCookie: null,
    error: null,
  };

  try {
    // 1. Crear token personalizado para test-uid
    const customToken = await adminAuth.createCustomToken("test-uid");
    response.tokenCreated = customToken ? "success" : "failed";

    // 2. Verificar el token en el servidor
    const decoded = await adminAuth.verifyIdToken(
      (await adminAuth.createSessionCookie(customToken, { expiresIn: 60_000 }))
        .catch(() => customToken)
    );

    response.idTokenVerified = decoded?.uid || "failed";

    // 3. Enviar petición al endpoint de sesión (como si fuera el cliente)
    const sessionRes = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/auth/session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: customToken }),
      }
    );

    response.sessionResult = await sessionRes.text();
    response.setCookie = sessionRes.headers.get("set-cookie") || null;

  } catch (err: any) {
    response.error = err.message;
  }

  return NextResponse.json(response);
}
