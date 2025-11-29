import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-server';

export async function POST(request: NextRequest) {
  try {
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
