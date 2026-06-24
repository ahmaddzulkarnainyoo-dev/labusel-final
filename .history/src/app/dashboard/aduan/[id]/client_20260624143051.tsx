// app/dashboard/aduan/[id]/client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Aduan {
  id: number;
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

interface Dinas {
  id: string;
  nama: string;
}

interface Props {
  aduan: Aduan;
  dokumentasi: Dokumentasi[];
  dinasList: Dinas[];
  role: string;
  profileDinasId: string;
}

export function AduanDetailClient({ aduan, dokumentasi, dinasList, role, profileDinasId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(aduan.status);
  const [dinasTerkait, setDinasTerkait] = useState(aduan.dinas_terkait || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/aduan/${aduan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          dinas_terkait: role === 'gubernur' ? dinasTerkait : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Gagal update status' });
        return;
      }

      setMessage({ type: 'success', text: 'Status aduan berhasil diupdate' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setLoading(false);
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
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/dashboard/aduan"
          className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar Aduan
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detail Aduan */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-900">Detail Aduan</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(aduan.status)}`}>
                {aduan.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Kode Tiket</p>
                <p className="font-mono font-bold text-lg text-blue-600">{aduan.kode_tiket}</p>
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
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {aduan.pesan}
                </p>
              </div>

              {aduan.foto_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Foto Aduan</p>
                  <img
                    src={aduan.foto_url}
                    alt="Foto aduan"
                    className="w-full max-w-lg rounded-lg border border-gray-200"
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

          {/* Dokumentasi jika selesai */}
          {aduan.status === 'Selesai' && dokumentasi.length > 0 && (
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

        {/* Update Status Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>

            {message && (
              <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Baru">Baru</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              {role === 'gubernur' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dinas Terkait
                  </label>
                  <select
                    value={dinasTerkait}
                    onChange={(e) => setDinasTerkait(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Pilih Dinas</option>
                    {dinasList.map((dinas) => (
                      <option key={dinas.id} value={dinas.id}>
                        {dinas.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : 'Update Status'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}