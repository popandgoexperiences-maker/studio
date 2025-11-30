import { Badge } from '@/components/ui/badge';
import type { Quote } from '@/lib/definitions';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: Quote['status'] }) {
  const statusText = {
    draft: 'Borrador',
    sent: 'Enviado',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
  };

  const statusColor = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50',
    sent: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
    accepted: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
    rejected: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
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
