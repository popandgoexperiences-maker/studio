import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Logo } from '@/components/logo';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
