import { PageHeader } from '@/components/page-header';
import { CreateClientForm } from '@/components/clients/create-client-form';

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        title="Nuevo Cliente"
        description="Rellena los datos para registrar un nuevo cliente."
      />
      <CreateClientForm />
    </div>
  );
}
