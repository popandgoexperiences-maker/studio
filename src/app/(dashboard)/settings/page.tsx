import { PageHeader } from '@/components/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import { fetchUser } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default async function SettingsPage() {
    const user = await fetchUser();
    
    const logo = PlaceHolderImages.find(img => img.id === 'default-logo');
    const signature = PlaceHolderImages.find(img => img.id === 'default-signature');
    const seal = PlaceHolderImages.find(img => img.id === 'default-seal');

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <PageHeader
                title="Configuración"
                description="Gestiona la información de tu empresa y tus datos personales."
            />
            <SettingsForm user={user} images={{ logo, signature, seal }} />
        </div>
    );
}
