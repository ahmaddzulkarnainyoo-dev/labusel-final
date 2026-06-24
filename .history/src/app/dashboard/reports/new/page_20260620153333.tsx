// app/dashboard/reports/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewReportPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('structured'); // 'structured' | 'free'
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    if (!title.trim() || !content.trim()) {
      setStatus({ type: 'error', message: 'Judul dan konten wajib diisi.' });
      setLoading(false);
      return;
    }

    let fileUrl = null;

    // Upload file jika ada
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, file);

      if (uploadError) {
        setStatus({ type: 'error', message: 'Gagal upload file: ' + uploadError.message });
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);

      fileUrl = urlData.publicUrl;
    }

    // Simpan laporan
    const payload = {
      title: title.trim(),
      content: content.trim(),
      type,
      attachment_url: fileUrl,
    };

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.ok) {
      setStatus({ type: 'success', message: 'Laporan berhasil dikirim!' });
      setTitle('');
      setContent('');
      setFile(null);
      setTimeout(() => router.push('/dashboard'), 2000);
    } else {
      setStatus({ type: 'error', message: result.error || 'Gagal mengirim laporan.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Laporan Baru</h1>
      <p className="text-gray-600 mb-8">
        Kirim laporan ke Gubernur. Pilih mode terstruktur atau bebas.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Mode Laporan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode Laporan
          </label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="structured"
                checked={type === 'structured'}
                onChange={() => setType('structured')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Terstruktur</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="free"
                checked={type === 'free'}
                onChange={() => setType('free')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Bebas</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {type === 'structured' ? 'Laporan dengan format yang sudah ditentukan.' : 'Laporan bebas sesuai kebutuhan.'}
          </p>
        </div>

        {/* Judul */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Judul Laporan <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Masukkan judul laporan"
            required
          />
        </div>

        {/* Konten */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Isi Laporan <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Tulis isi laporan di sini..."
            required
          />
        </div>

        {/* Upload File */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Lampiran (opsional)
          </label>
          <input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && <p className="mt-1 text-sm text-gray-500">File: {file.name}</p>}
        </div>

        {/* Status */}
        {status.type && (
          <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {status.message}
          </div>
        )}

        {/* Tombol Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Mengirim...' : 'Kirim Laporan'}
        </button>
      </form>
    </div>
  );
}