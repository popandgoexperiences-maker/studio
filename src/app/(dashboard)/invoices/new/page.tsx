import { PageHeader } from '@/components/page-header';
import { CreateInvoiceForm } from '@/components/invoices/create-invoice-form';

export default function NewInvoicePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Nueva Factura"
        description="Rellena los datos para crear una nueva factura."
      />
      <CreateInvoiceForm />
    </div>
  );
}
