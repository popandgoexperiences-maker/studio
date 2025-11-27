'use client';

import React from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { logout } from '@/lib/actions';
import { useUser, useFirebase } from '@/firebase';
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

export function UserProfileButton() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  
  React.useEffect(() => {
    // If loading, or services aren't ready, wait. This is the fix.
    if (isUserLoading || !firestore || !user) {
      setProfileLoading(true); // Keep showing skeleton while we wait
      if (!isUserLoading && !user) {
        // If loading is done and there's no user, stop loading UI.
        setProfileLoading(false);
        setUserProfile(null);
      }
      return; // Stop execution until everything is ready
    }
    
    // At this point, user and firestore are guaranteed to be available.
    const { doc, onSnapshot } = require('firebase/firestore');
    const userDocRef = doc(firestore, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
      } else {
        setUserProfile(null); // Handle case where profile doc might not exist
      }
      setProfileLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setProfileLoading(false); // Handle potential errors during fetch
    });
    
    return () => unsubscribe();
  }, [user, isUserLoading, firestore]);

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
  
  if (!user || !userProfile) {
    return null; // Or a login button
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
