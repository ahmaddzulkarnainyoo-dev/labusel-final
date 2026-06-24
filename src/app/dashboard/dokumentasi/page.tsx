// app/dashboard/dokumentasi/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DokumentasiItem {
  id: number;
  judul: string;
  deskripsi: string;
  foto_url: string;
  minggu_ke: number;
  tahun: number;
  aduan_id: number | null;
  created_at: string;
  created_by: string;
  aduan?: {
    kode_tiket: string;
  };
}

interface AduanSelesai {
  id: number;
  kode_tiket: string;
}

export default function DokumentasiPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dokumentasiList, setDokumentasiList] = useState<DokumentasiItem[]>([]);
  const [aduanSelesai, setAduanSelesai] = useState<AduanSelesai[]>([]);

  // Form state
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [mingguKe, setMingguKe] = useState<number>(1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [aduanId, setAduanId] = useState<string>('');

  useEffect(() => {
    fetchDokumentasi();
    fetchAduanSelesai();
  }, []);

  async function fetchDokumentasi() {
    const { data, error } = await supabase
      .from('dokumentasi_dinas')
      .select('*, aduan:kode_tiket(kode_tiket)')
      .order('created_at', { ascending: false });

    if (data) {
      setDokumentasiList(data as unknown as DokumentasiItem[]);
    }
  }

  async function fetchAduanSelesai() {
    const { data, error } = await supabase
      .from('aduan')
      .select('id, kode_tiket')
      .eq('status', 'Selesai')
      .order('kode_tiket', { ascending: false });

    if (data) {
      setAduanSelesai(data);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!judul || !foto) {
        setError('Judul dan foto wajib diisi');
        setLoading(false);
        return;
      }

      // Upload foto ke Supabase Storage
      const fileExt = foto.name.split('.').pop();
      const fileName = `dokumentasi/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dokumentasi')
        .upload(fileName, foto, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setError('Gagal mengupload foto: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('dokumentasi')
        .getPublicUrl(fileName);

      const fotoUrl = urlData?.publicUrl || '';

      // Dapatkan user saat ini
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Anda harus login');
        setLoading(false);
        return;
      }

      // Simpan ke database
      const { error: insertError } = await supabase
        .from('dokumentasi_dinas')
        .insert({
          judul,
          deskripsi: deskripsi || null,
          foto_url: fotoUrl,
          minggu_ke: mingguKe,
          tahun: tahun,
          aduan_id: aduanId ? parseInt(aduanId) : null,
          created_by: user.id,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        setError('Gagal menyimpan dokumentasi: ' + insertError.message);
        setLoading(false);
        return;
      }

      setSuccess('Dokumentasi berhasil diupload');
      setJudul('');
      setDeskripsi('');
      setFoto(null);
      setMingguKe(1);
      setTahun(new Date().getFullYear());
      setAduanId('');

      fetchDokumentasi();
    } catch (err: any) {
      setError('Terjadi kesalahan: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Dokumentasi Mingguan</h1>
      <p className="text-gray-600 mb-8">
        Upload foto dokumentasi kegiatan dinas Anda untuk ditampilkan di halaman aduan.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Judul <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Judul dokumentasi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aduan Terkait (opsional)
              </label>
              <select
                value={aduanId}
                onChange={(e) => setAduanId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">Pilih aduan (opsional)</option>
                {aduanSelesai.map((aduan) => (
                  <option key={aduan.id} value={aduan.id}>
                    {aduan.kode_tiket}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi (opsional)
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              placeholder="Deskripsi dokumentasi"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minggu ke <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={mingguKe}
                onChange={(e) => setMingguKe(parseInt(e.target.value) || 1)}
                required
                min={1}
                max={53}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tahun <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value) || new Date().getFullYear())}
                required
                min={2020}
                max={2030}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Foto <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Upload file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFoto(e.target.files[0]);
                        }
                      }}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">atau drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF maksimal 5MB</p>
                {foto && (
                  <p className="text-sm text-green-600 font-medium">{foto.name}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 text-white py-2.5 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Mengupload...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Daftar Dokumentasi */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Daftar Dokumentasi</h2>
      {dokumentasiList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">Belum ada dokumentasi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dokumentasiList.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {doc.foto_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={doc.foto_url}
                    alt={doc.judul}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1">{doc.judul}</h3>
                {doc.deskripsi && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{doc.deskripsi}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Minggu ke-{doc.minggu_ke} - {doc.tahun}</span>
                  <span>{formatDate(doc.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}