'use server';

import { NextResponse } from "next/server";
import admin from "firebase-admin";

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || null;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || null;

  const response = {
    env: {
      FIREBASE_PROJECT_ID: projectId,
      FIREBASE_CLIENT_EMAIL: clientEmail,
      FIREBASE_PRIVATE_KEY_present: !!privateKey,
    },
    adminInit: "failed" as "success" | "failed",
    error: "Not attempted" as any,
  };

  if (!projectId || !clientEmail || !privateKey) {
    response.error = "Una o más variables de entorno de Firebase no están definidas.";
    return NextResponse.json(response);
  }

  try {
    const serviceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
    
    // Intenta inicializar una app temporal para no interferir con la principal
    if (admin.apps.find(app => app?.name === 'debug-check')) {
        // No hacer nada si ya existe
    } else {
         admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        }, 'debug-check');
    }

    response.adminInit = "success";
    response.error = null;

  } catch (error: any) {
    response.adminInit = "failed";
    response.error = {
        message: error.message,
        code: error.code,
        stack: error.stack.substring(0, 300) + '...', // Acortar el stack trace
    };
  }

  return NextResponse.json(response);
}
