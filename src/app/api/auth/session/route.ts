import { getFirebaseAuth } from '@/lib/firebase-server';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Handles POST requests to create a session cookie.
 * Expects the Firebase ID token in the request body.
 */
export async function POST(request: NextRequest) {
  const { auth } = getFirebaseAuth();
  const idToken = await request.text();

  try {
    // Verify the ID token and create a session cookie.
    await auth.verifyIdToken(idToken);
    
    // The session cookie will be valid for 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    // Set the session cookie on the client.
    cookies().set(options);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
}

/**
 * Handles DELETE requests to clear the session cookie upon user logout.
 */
export async function DELETE() {
  try {
    // Clear the session cookie by setting its maxAge to 0.
    cookies().set('__session', '', { maxAge: 0 });
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error deleting session cookie:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
