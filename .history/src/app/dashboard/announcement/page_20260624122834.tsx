// app/dashboard/announcements/page.tsx
import { getCurrentProfile } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AnnouncementsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = createServerComponentClient();

  // Ambil semua pengumuman, urutkan dari yang terbaru
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles:created_by (
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements:', error);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-gray-600 mt-1">
            Semua pengumuman dari Bupati Labuhanbatu Selatan
          </p>
        </div>
        {profile.role === 'gubernur' && (
          <Link
            href="/dashboard/broadcast"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Kirim Pengumuman
          </Link>
        )}
      </div>

      {announcements && announcements.length > 0 ? (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>
                      Oleh: {announcement.profiles?.full_name || 'Bupati'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                {announcement.target_dinas_id && announcement.target_dinas_id.length > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Target Dinas
                  </span>
                )}
                {(!announcement.target_dinas_id || announcement.target_dinas_id.length === 0) && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Semua Dinas
                  </span>
                )}
              </div>

              <div className="mt-4 prose prose-sm max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{announcement.content}</p>
              </div>

              {announcement.target_dinas_id && announcement.target_dinas_id.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {announcement.target_dinas_id.map((id: string) => (
                    <span
                      key={id}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {id.substring(0, 8)}...
                    </span>
                  ))}
                  <span className="px-2 py-0.5 text-xs text-gray-400">
                    + {announcement.target_dinas_id.length} dinas
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada pengumuman.</p>
          {profile.role === 'gubernur' && (
            <Link
              href="/dashboard/broadcast"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Kirim Pengumuman Pertama
            </Link>
          )}
        </div>
      )}
    </div>
  );
}