// app/dashboard/calendar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Dinas {
  id: string;
  nama: string;
}

export default function CalendarMarkerPage() {
  const [tanggal, setTanggal] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [targetDinas, setTargetDinas] = useState<string[]>([]);
  const [dinasList, setDinasList] = useState<Dinas[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const router = useRouter();
  const supabase = createClient();

  // Ambil daftar dinas & role user
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Ambil profile + role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, dinas_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setRole(profile.role);
        // Jika Kepala Dinas, langsung isi target dengan dinasnya
        if (profile.role === 'kepala_dinas' && profile.dinas_id) {
          setTargetDinas([profile.dinas_id]);
        }
      }

      // Ambil daftar dinas (untuk dropdown)
      const { data: dinas } = await supabase
        .from('dinas')
        .select('id, nama')
        .order('nama', { ascending: true });
      if (dinas) setDinasList(dinas);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    if (!tanggal || !judul) {
      setStatus({ type: 'error', message: 'Tanggal dan judul wajib diisi.' });
      setLoading(false);
      return;
    }

    const res = await fetch('/api/calendar-markers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tanggal,
        judul,
        deskripsi,
        target_dinas_id: targetDinas,
      }),
    });

    const result = await res.json();

    if (res.ok) {
      setStatus({ type: 'success', message: 'Penanda kalender berhasil dibuat!' });
      setTanggal('');
      setJudul('');
      setDeskripsi('');
      setTargetDinas([]);
    } else {
      setStatus({ type: 'error', message: result.error || 'Gagal membuat penanda.' });
    }
    setLoading(false);
  };

  const toggleDinas = (id: string) => {
    setTargetDinas(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const isBupati = role === 'gubernur';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Penanda Kalender</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-blue-600"
          >
            ← Kembali
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Buat penanda yang akan muncul di kalender staf untuk memberi tahu hari ini tentang apa.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Misal: Rapat Paripurna"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi (opsional)
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Detail tentang acara ini..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          {isBupati && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Dinas (opsional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Kosongkan untuk semua dinas. Pilih dinas tertentu jika hanya untuk sebagian.
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 border border-gray-200 rounded-lg">
                {dinasList.map((d) => (
                  <label key={d.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targetDinas.includes(d.id)}
                      onChange={() => toggleDinas(d.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{d.nama}</span>
                  </label>
                ))}
              </div>
              {targetDinas.length > 0 && (
                <p className="text-xs text-blue-600 mt-2">Terpilih {targetDinas.length} dinas.</p>
              )}
            </div>
          )}

          {!isBupati && (
            <p className="text-xs text-gray-500">Penanda akan otomatis ditargetkan ke dinas Anda.</p>
          )}

          {status.type && (
            <div className={`p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Penanda'}
          </button>
        </form>
      </div>
    </div>
  );
}