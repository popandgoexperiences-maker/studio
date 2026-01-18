
import { PageHeader } from '@/components/page-header';
import { EditClientForm } from '@/components/clients/edit-client-form';
import { getAuthSafe } from '@/lib/firebase-server';
import { fetchClient } from '@/lib/data';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) {
    return notFound();
  }

  const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
  const userId = decodedToken.uid;

  const client = await fetchClient(userId, params.id);

  if (!client) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Editar Cliente"
        description="Modifica los datos del cliente y guarda los cambios."
      />
      <EditClientForm client={client} />
    </div>
  );
}
