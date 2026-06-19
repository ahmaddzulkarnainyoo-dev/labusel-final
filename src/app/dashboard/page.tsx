// app/dashboard/page.tsx
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const role = profile.role;
  if (role === 'gubernur') redirect('/dashboard/gubernur');
  if (role === 'kepala_dinas') redirect('/dashboard/kepala-dinas');
  if (role === 'staf') redirect('/dashboard/staf');
  // fallback
  redirect('/login');
}