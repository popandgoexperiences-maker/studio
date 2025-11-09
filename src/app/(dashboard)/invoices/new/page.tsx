import { PageHeader } from '@/components/page-header';
import { CreateInvoiceForm } from '@/components/invoices/create-invoice-form';
import { fetchClients, fetchUser } from '@/lib/data';

export default async function NewInvoicePage() {
  const [clients, user] = await Promise.all([
    fetchClients(),
    fetchUser(),
  ]);
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Nueva Factura"
        description="Rellena los datos para crear una nueva factura."
      />
      <CreateInvoiceForm clients={clients} user={user} />
    </div>
  );
}
