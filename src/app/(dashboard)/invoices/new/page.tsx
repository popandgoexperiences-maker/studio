'use client';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { CreateInvoiceForm } from '@/components/invoices/create-invoice-form';
import { fetchClients, fetchUser } from '@/lib/data';
import type { Client, User } from '@/lib/definitions';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewInvoicePage() {
  const { user: authUser, isUserLoading } = useUser();

  const [clients, setClients] = useState<Client[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      async function loadData() {
        try {
          const [clientsData, userData] = await Promise.all([
            fetchClients(authUser!.uid),
            fetchUser(authUser!.uid),
          ]);
          setClients(clientsData);
          setUser(userData);
        } catch (error) {
          console.error("Failed to load data:", error);
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [authUser]);

  const showLoading = isUserLoading || loading;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Nueva Factura"
        description="Rellena los datos para crear una nueva factura."
      />
      {showLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-8">
                <Skeleton className="h-80 w-full" />
            </div>
        </div>
      ) : user && (
        <CreateInvoiceForm clients={clients} user={user} />
      )}
    </div>
  );
}
