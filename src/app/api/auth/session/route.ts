import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-server';

/**
 * Handles POST requests to create a session cookie.
 * Expects the Firebase ID token in the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return new NextResponse(
        JSON.stringify({ status: 'error', message: 'ID token is missing.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // The session cookie will be valid for 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      path: '/',
    };

    // Create a response and set the cookie on it.
    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set(options);

    return response;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return new NextResponse(
        JSON.stringify({ status: 'error', message: 'Failed to create session.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handles DELETE requests to clear the session cookie upon user logout.
 */
export async function DELETE() {
  try {
    // Clear the session cookie by setting its maxAge to 0.
    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set('__session', '', { maxAge: 0 });
    return response;

  } catch (error) {
    console.error('Error deleting session cookie:', error);
    return new NextResponse(
        JSON.stringify({ status: 'error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
