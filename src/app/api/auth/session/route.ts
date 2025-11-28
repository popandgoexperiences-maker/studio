import { getFirebaseAuth } from '@/lib/firebase-server';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Handles POST requests to create a session cookie.
 * Expects the Firebase ID token in the Authorization header.
 */
export async function POST(request: NextRequest) {
  const { auth } = getFirebaseAuth();
  const authorization = request.headers.get('Authorization');
  
  if (!authorization?.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ status: 'error', message: 'Missing or invalid Authorization header.' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const idToken = authorization.split('Bearer ')[1];

  if (!idToken) {
    return new NextResponse(
      JSON.stringify({ status: 'error', message: 'ID token is missing.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

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
