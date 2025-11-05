import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/lib/definitions';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: Invoice['status'] }) {
  const statusText = {
    pending: 'Pendiente',
    paid: 'Pagada',
    generating: 'Generando...',
    draft: 'Borrador',
  };

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50',
    paid: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
    generating: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
    draft: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50',
  };

  return (
    <Badge
      variant="outline"
      className={cn("capitalize", statusColor[status])}
    >
      {statusText[status]}
    </Badge>
  );
}
