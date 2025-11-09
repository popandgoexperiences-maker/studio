import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
