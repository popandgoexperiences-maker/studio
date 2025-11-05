import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  // The root of the dashboard is the invoices page.
  redirect('/invoices');
}
