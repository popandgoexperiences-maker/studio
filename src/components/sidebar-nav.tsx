'use client';

import React from 'react';
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
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Settings, LogOut, FileText, User } from 'lucide-react';
import { logout } from '@/lib/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SidebarNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const navItems = [
    { href: '/invoices', label: 'Facturas', icon: FileText },
    { href: '/settings', label: 'Configuración', icon: Settings },
  ];

  const userProfile = (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src="https://picsum.photos/seed/avatar/40/40" alt="Avatar" data-ai-hint="person avatar" />
        <AvatarFallback>TN</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium text-sidebar-foreground">Tu Nombre</p>
        <p className="text-xs text-sidebar-foreground/70">tu@email.com</p>
      </div>
    </div>
  );

  return (
    <>
      <SidebarHeader>
        <Logo className="text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="p-2">
          {isMobile ? (
             userProfile
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto w-full justify-start p-2 text-left">
                  {userProfile}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <form action={logout}>
                   <DropdownMenuItem asChild>
                     <button type="submit" className='w-full'>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                     </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarFooter>
    </>
  );
}
