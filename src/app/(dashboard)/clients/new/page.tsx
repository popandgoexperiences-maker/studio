import { PageHeader } from '@/components/page-header';
import { CreateClientForm } from '@/components/clients/create-client-form';

export default function NewClientPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Nuevo Cliente"
        description="Rellena los datos para registrar un nuevo cliente."
      />
      <CreateClientForm />
    </div>
  );
}
