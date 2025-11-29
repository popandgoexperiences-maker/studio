import type {NextConfig} from 'next';
import admin from 'firebase-admin';

// --- Initialize Firebase Admin SDK ---
// This ensures the SDK is initialized only once when the server starts.
if (!admin.apps.length) {
  console.log("--- Initializing Firebase Admin SDK ---");
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully in next.config.ts.");
    } catch (e: any) {
        console.error("Firebase Admin SDK initialization error in next.config.ts:", e.stack);
    }
  } else {
      console.warn("Firebase Admin environment variables are not fully set. Skipping initialization.");
  }
}
// -------------------------------------


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
