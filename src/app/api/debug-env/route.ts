import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    return NextResponse.json({ error: "❌ Variable no encontrada" }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      status: "✔ JSON válido",
      project_id: parsed.project_id,
      private_key_preview: parsed.private_key?.slice(0, 50) + "...",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "❌ JSON inválido",
      error: error.message,
      rawSample: raw.slice(0, 200)
    }, { status: 500 });
  }
}
