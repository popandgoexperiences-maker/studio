'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar, // Import the hook
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Settings, FileText, Users, ClipboardList } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserProfileButton } from './auth/user-profile-button';
import { useEffect, useState } from 'react';

export function SidebarNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { setOpenMobile } = useSidebar(); // Get the function to close the mobile sidebar

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems = [
    { href: '/invoices', label: 'Facturas', icon: FileText },
    { href: '/quotes', label: 'Presupuestos', icon: ClipboardList },
    { href: '/clients', label: 'Clientes', icon: Users },
    { href: '/settings', label: 'Configuración', icon: Settings },
  ];

  if (!isClient) {
    return (
      <>
        <SidebarHeader>
          <Logo className="text-sidebar-foreground" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          {/* Skeleton or placeholder */}
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <div className="p-2">
            <UserProfileButton />
          </div>
        </SidebarFooter>
      </>
    );
  }

  return (
    <>
      <SidebarHeader>
        <Logo className="text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Add onClick to close the sidebar */}
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <SidebarMenuButton isActive={isActive}>
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="p-2">
          <UserProfileButton />
        </div>
      </SidebarFooter>
    </>
  );
}
