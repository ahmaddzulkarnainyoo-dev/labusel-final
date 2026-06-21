// app/dashboard/calendar-markers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Dinas {
  id: string;
  nama: string;
}

interface CalendarMarker {
  id: string;
  tanggal: string;
  judul: string;
  deskripsi: string;
  target_dinas_id: string[] | null;
  created_by: string;
  created_at: string;
}

export default function CalendarMarkersPage() {
  const [tanggal, setTanggal] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [targetDinas, setTargetDinas] = useState<string[]>([]);
  const [dinasList, setDinasList] = useState<Dinas[]>([]);
  const [markers, setMarkers] = useState<CalendarMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userDinasId, setUserDinasId] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Ambil profile user
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, dinas_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
        setUserDinasId(profile.dinas_id || '');
      }

      // Ambil daftar dinas
      const { data: dinas } = await supabase
        .from('dinas')
        .select('id, nama')
        .order('nama', { ascending: true });

      if (dinas) setDinasList(dinas);

      // Ambil penanda kalender
      await fetchMarkers(profile?.role || '', profile?.dinas_id || '');
      setLoading(false);
    };

    init();
  }, []);

  const fetchMarkers = async (role: string, dinasId: string) => {
    let query = supabase
      .from('calendar_markers')
      .select('*')
      .order('tanggal', { ascending: false });

    if (role !== 'gubernur') {
      // Kepala Dinas: lihat penanda untuk dinasnya sendiri atau untuk semua
      query = query.or(`target_dinas_id.cs.{${dinasId}},target_dinas_id.is.null`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setMarkers(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: null, message: '' });

    if (!tanggal || !judul.trim()) {
      setStatus({ type: 'error', message: 'Tanggal dan judul wajib diisi.' });
      setSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus({ type: 'error', message: 'Silakan login terlebih dahulu.' });
      setSubmitting(false);
      return;
    }

    const payload: any = {
      tanggal,
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      created_by: user.id,
    };

    // Untuk Gubernur: bisa pilih target dinas
    // Untuk Kepala Dinas: otomatis dinasnya sendiri
    if (userRole === 'gubernur') {
      payload.target_dinas_id = targetDinas.length > 0 ? targetDinas : null;
    } else {
      payload.target_dinas_id = userDinasId ? [userDinasId] : null;
    }

    const { error } = await supabase.from('calendar_markers').insert(payload);

    if (error) {
      setStatus({ type: 'error', message: 'Gagal menyimpan: ' + error.message });
    } else {
      setStatus({ type: 'success', message: 'Penanda kalender berhasil dibuat!' });
      setTanggal('');
      setJudul('');
      setDeskripsi('');
      setTargetDinas([]);
      // Refresh daftar
      await fetchMarkers(userRole, userDinasId);
    }
    setSubmitting(false);
  };

  const toggleDinas = (id: string) => {
    setTargetDinas(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Atur Penanda Kalender</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <div>
            <label htmlFor="judul" className="block text-sm font-medium text-gray-700">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              id="judul"
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Nama acara / penanda"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">
            Deskripsi
          </label>
          <textarea
            id="deskripsi"
            rows={3}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Deskripsi acara (opsional)"
          />
        </div>

        {/* Target Dinas - hanya untuk Gubernur */}
        {userRole === 'gubernur' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Dinas (opsional)
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Kosongkan untuk menampilkan ke semua dinas.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {dinasList.map((dinas) => (
                <label key={dinas.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetDinas.includes(dinas.id)}
                    onChange={() => toggleDinas(dinas.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{dinas.nama}</span>
                </label>
              ))}
            </div>
            {targetDinas.length > 0 && (
              <p className="mt-2 text-sm text-blue-600">
                Terpilih {targetDinas.length} dinas.
              </p>
            )}
          </div>
        )}

        {userRole !== 'gubernur' && (
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            Penanda kalender akan otomatis ditampilkan untuk dinas Anda.
          </div>
        )}

        {status.type && (
          <div className={`p-4 rounded-lg ${
            status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Menyimpan...' : 'Buat Penanda'}
        </button>
      </form>

      {/* Daftar Penanda */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Daftar Penanda Kalender</h2>
      {markers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada penanda kalender.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {markers.map((marker) => (
            <div key={marker.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {new Date(marker.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2">{marker.judul}</h3>
                  {marker.deskripsi && (
                    <p className="text-sm text-gray-600 mt-1">{marker.deskripsi}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {marker.target_dinas_id && marker.target_dinas_id.length > 0
                      ? `Target: ${marker.target_dinas_id.length} dinas`
                      : 'Semua dinas'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}