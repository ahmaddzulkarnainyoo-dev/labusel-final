// app/cek-status/page.tsx
'use client';

import { useState } from 'react';

interface AduanDetail {
  kode_tiket: string;
  nama_pengadu: string;
  email_pengadu: string;
  kategori: string;
  pesan: string;
  foto_url: string | null;
  status: string;
  dinas_terkait: string | null;
  created_at: string;
  updated_at: string;
}

interface Dokumentasi {
  id: number;
  judul: string;
  deskripsi: string;
  foto_url: string;
  minggu_ke: number;
  tahun: number;
  created_at: string;
}

export default function CekStatusPage() {
  const [kodeTiket, setKodeTiket] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aduan, setAduan] = useState<AduanDetail | null>(null);
  const [dokumentasi, setDokumentasi] = useState<Dokumentasi[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAduan(null);
    setDokumentasi([]);
    setSearched(false);

    if (!kodeTiket.trim()) {
      setError('Masukkan kode tiket');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/aduan/cek?kode_tiket=${encodeURIComponent(kodeTiket.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kode tiket tidak ditemukan');
        setSearched(true);
        return;
      }

      setAduan(data.aduan);
      setDokumentasi(data.dokumentasi || []);
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      'Baru': 'bg-yellow-100 text-yellow-800',
      'Diproses': 'bg-blue-100 text-blue-800',
      'Selesai': 'bg-green-100 text-green-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xl font-bold text-blue-600">Labusel</span>
            <span className="text-sm text-gray-500">Gov</span>
          </div>
          <nav className="flex space-x-6 text-sm">
            <a href="/" className="text-gray-600 hover:text-blue-600">Beranda</a>
            <a href="/aduan" className="text-gray-600 hover:text-blue-600">Aduan Masyarakat</a>
            <a href="/cek-status" className="text-blue-600 font-medium">Cek Status</a>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Cek Status Aduan</h1>
        <p className="text-gray-600 mb-8">
          Masukkan kode tiket yang Anda dapatkan saat mengirim aduan.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={kodeTiket}
                onChange={(e) => setKodeTiket(e.target.value)}
                placeholder="Contoh: LBS-2026-0001"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Cek Status</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Not Found */}
        {searched && !aduan && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kode Tiket Tidak Ditemukan</h3>
            <p className="text-gray-500">Pastikan kode tiket yang Anda masukkan sudah benar.</p>
          </div>
        )}

        {/* Aduan Detail */}
        {aduan && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Detail Aduan</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(aduan.status)}`}>
                  {aduan.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Kode Tiket</p>
                  <p className="font-mono font-bold text-blue-600">{aduan.kode_tiket}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nama Pengadu</p>
                    <p className="font-medium text-gray-900">{aduan.nama_pengadu}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{aduan.email_pengadu}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Kategori</p>
                  <p className="font-medium text-gray-900">{aduan.kategori}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Pesan Aduan</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{aduan.pesan}</p>
                </div>

                {aduan.foto_url && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Foto</p>
                    <img
                      src={aduan.foto_url}
                      alt="Foto aduan"
                      className="w-full max-w-md rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Dibuat</p>
                    <p className="font-medium text-gray-900">{formatDate(aduan.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Terakhir Diupdate</p>
                    <p className="font-medium text-gray-900">{formatDate(aduan.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dokumentasi */}
            {dokumentasi.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dokumentasi Tindak Lanjut</h2>
                <div className="space-y-4">
                  {dokumentasi.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{doc.judul}</h3>
                      {doc.deskripsi && (
                        <p className="text-sm text-gray-600 mb-3">{doc.deskripsi}</p>
                      )}
                      {doc.foto_url && (
                        <img
                          src={doc.foto_url}
                          alt={doc.judul}
                          className="w-full max-w-md rounded-lg border border-gray-200 mb-2"
                        />
                      )}
                      <p className="text-xs text-gray-400">
                        Minggu ke-{doc.minggu_ke} - {doc.tahun} | {formatDate(doc.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          Pemerintah Kabupaten Labuhanbatu Selatan &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}