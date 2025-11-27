'use client';

import React from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { logout } from '@/lib/actions';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/definitions';

export function UserProfileButton() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );
  
  const { data: userProfile, isLoading: profileLoading } = useDoc<User>(userDocRef);

  const isLoading = isUserLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-2 h-[52px]">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }
  
  if (!authUser || !userProfile) {
    return null; // O un botón de login
  }

  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start p-2 text-left">
          <Avatar className="h-9 w-9">
            {userProfile?.logoUrl ? (
                <AvatarImage src={userProfile.logoUrl} alt="Logo de la empresa" data-ai-hint="company logo" />
            ): (
                <AvatarImage src="https://picsum.photos/seed/avatar/40/40" alt="Avatar" data-ai-hint="person avatar" />
            )}
            <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
          </Avatar>
          <div className='text-left ml-2'>
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userProfile.name}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{userProfile.email}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/settings">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Perfil</span>
            </Link>
        </DropdownMenuItem>
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
  );
}
