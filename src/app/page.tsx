import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the main dashboard page, which is now the invoices page.
  redirect('/invoices');
}
