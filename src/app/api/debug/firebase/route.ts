import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.FIREBASE_PRIVATE_KEY;

  return NextResponse.json({
    hasKey: key ? true : false,
    length: key?.length ?? 0,
    containsEscapedNewlines: key?.includes("\\n") ?? false,
    startsWithBegin: key?.includes("BEGIN PRIVATE KEY") ?? false,
    endsWithEnd: key?.includes("END PRIVATE KEY") ?? false,
  });
}
