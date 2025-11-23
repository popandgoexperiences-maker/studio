'use client';

import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import { FirebaseClientProvider, useUser } from "@/firebase";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="relative min-h-screen bg-background">
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <main className="ml-0 md:ml-[16rem] transition-[margin-left] duration-300 ease-in-out">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <DashboardContent>{children}</DashboardContent>
    </FirebaseClientProvider>
  );
}
