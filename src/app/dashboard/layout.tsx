// app/dashboard/layout.tsx
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const role = profile.role;
  const roleLabel =
    role === 'gubernur' ? 'Gubernur' :
    role === 'kepala_dinas' ? 'Kepala Dinas' :
    'Staf';

  const dashboardPath =
    role === 'gubernur' ? '/dashboard/gubernur' :
    role === 'kepala_dinas' ? '/dashboard/kepala-dinas' :
    '/dashboard/staf';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600">Labusel</span>
            <span className="text-sm text-gray-500">Gov</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">{profile.full_name || 'User'}</span>
            <span className="block text-xs text-gray-400">{roleLabel}</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href={dashboardPath}
            className="block px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/announcements"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Pengumuman
          </Link>
          {role === 'gubernur' && (
            <>
              <Link
                href="/dashboard/broadcast"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Broadcast
              </Link>
              <Link
                href="/dashboard/reports"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Laporan Masuk
              </Link>
            </>
          )}
          {(role === 'kepala_dinas' || role === 'staf') && (
            <Link
              href="/dashboard/reports/new"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              Buat Laporan
            </Link>
          )}
          <Link
            href="/dashboard/profile"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Profil
          </Link>
          <LogoutButton />
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="text-sm text-gray-600">
            {profile.full_name || 'User'} • {roleLabel}
          </div>
        </header>
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}