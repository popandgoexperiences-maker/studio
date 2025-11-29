import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-server";

export async function GET() {
  const result: any = {
    step1_testToken: null,
    step2_signIn: null,
    step3_sessionCreation: null,
    setCookieHeader: null,
    error: null,
  };

  try {
    // 1. Obtener custom token desde el endpoint existente
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/test-token`);
    const tokenJson = await tokenRes.json();
    result.step1_testToken = tokenJson;

    // 2. Intercambiar custom token -> idToken usando Admin SDK
    const firebaseUser = await adminAuth.verifyIdToken(tokenJson.uid ? tokenJson.uid : "test-uid");

    result.step2_signIn = {
      status: "success",
      uid: firebaseUser.uid,
    };

    // 3. Enviar idToken al endpoint que debe crear la cookie de sesión
    const sessionRes = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/auth/session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: tokenJson.token }),
      }
    );

    const sessionBody = await sessionRes.text();
    result.step3_sessionCreation = {
      status: sessionRes.status,
      body: sessionBody,
    };

    result.setCookieHeader = sessionRes.headers.get("set-cookie") || null;
  } catch (err: any) {
    result.error = err.message;
  }

  return NextResponse.json(result);
}
