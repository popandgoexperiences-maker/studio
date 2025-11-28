'use client';

import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import { useUser } from "@/firebase";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if loading is finished and there's no user.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // While loading, or if there's no user (and the redirect is about to happen),
  // show a loading screen. This prevents rendering child components prematurely.
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  // If loading is finished and there IS a user, render the dashboard.
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
    <DashboardContent>{children}</DashboardContent>
  );
}
