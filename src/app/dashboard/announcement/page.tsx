import { createServerComponentClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'

export default async function AnnouncementsPage() {
  const profile = await getCurrentProfile()
  if (!profile) return null

  const supabase = createServerComponentClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daftar Pengumuman</h1>
      {announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-semibold text-gray-900">{ann.title}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{ann.content}</p>
              <p className="mt-2 text-sm text-gray-500">
                Dikirim oleh: {ann.profiles?.full_name || 'Gubernur'}
              </p>
              {ann.target_dinas_id && ann.target_dinas_id.length > 0 && (
                <p className="text-sm text-blue-600">
                  Target: {ann.target_dinas_id.length} dinas
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Belum ada pengumuman.</p>
      )}
    </div>
  )
}