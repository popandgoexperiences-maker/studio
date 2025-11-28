import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-server';

/**
 * Handles POST requests to create a session cookie.
 * Expects the Firebase ID token in the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // The session cookie will be valid for 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Validate the ID token and create the session cookie.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    // Create a response and set the cookie on it.
    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set(options);

    return response;
  } catch (error) {
    console.error('SESSION API ERROR:', error);
    return NextResponse.json(
      { error: 'Session creation failed' },
      { status: 401 }
    );
  }
}
