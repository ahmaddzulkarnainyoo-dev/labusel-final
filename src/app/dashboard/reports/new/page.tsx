'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Dinas {
  id: string
  nama: string
  singkatan: string
}

export default function NewReportPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [mode, setMode] = useState<'terstruktur' | 'bebas'>('terstruktur')
  const [dinasId, setDinasId] = useState('')
  const [dinasList, setDinasList] = useState<Dinas[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  })
  const router = useRouter()
  const supabase = createClient()

  // Ambil daftar dinas untuk user (bisa disesuaikan)
  useEffect(() => {
    const fetchDinas = async () => {
      const { data, error } = await supabase.from('dinas').select('*').order('nama')
      if (!error && data) {
        setDinasList(data)
        if (data.length > 0) setDinasId(data[0].id)
      }
    }
    fetchDinas()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: null, message: '' })

    // Validasi
    if (!title.trim() || !content.trim() || !dinasId) {
      setStatus({ type: 'error', message: 'Judul, konten, dan dinas wajib diisi.' })
      setLoading(false)
      return
    }

    // Upload file jika ada
    let fileUrl = null
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(`public/${fileName}`, file)

      if (uploadError) {
        setStatus({ type: 'error', message: 'Gagal upload file: ' + uploadError.message })
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(`public/${fileName}`)
      fileUrl = urlData?.publicUrl || null
    }

    // Submit laporan
    const payload = {
      title: title.trim(),
      content: content.trim(),
      category: category || null,
      mode,
      dinas_id: dinasId,
      file_url: fileUrl,
    }

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await res.json()

    if (res.ok) {
      setStatus({ type: 'success', message: 'Laporan berhasil dikirim!' })
      setTitle('')
      setContent('')
      setCategory('')
      setFile(null)
      setTimeout(() => router.push('/dashboard/reports'), 1500)
    } else {
      setStatus({ type: 'error', message: result.error || 'Gagal mengirim laporan.' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Laporan Baru</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mode Laporan</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="terstruktur"
                checked={mode === 'terstruktur'}
                onChange={() => setMode('terstruktur')}
                className="w-4 h-4 text-blue-600"
              />
              <span>Terstruktur (form isian)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="bebas"
                checked={mode === 'bebas'}
                onChange={() => setMode('bebas')}
                className="w-4 h-4 text-blue-600"
              />
              <span>Bebas (textarea)</span>
            </label>
          </div>
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
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Masukkan judul laporan"
            required
          />
        </div>

        {/* Konten */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            {mode === 'terstruktur' ? 'Deskripsi Laporan' : 'Isi Laporan (bebas)'} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder={mode === 'terstruktur' ? 'Tulis deskripsi laporan...' : 'Tulis laporan secara bebas...'}
            required
          />
        </div>

        {/* Kategori (opsional, hanya untuk terstruktur) */}
        {mode === 'terstruktur' && (
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Kategori (opsional)
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Contoh: Keuangan, Infrastruktur, dll"
            />
          </div>
        )}

        {/* Pilih Dinas */}
        <div>
          <label htmlFor="dinas" className="block text-sm font-medium text-gray-700">
            Dinas <span className="text-red-500">*</span>
          </label>
          <select
            id="dinas"
            value={dinasId}
            onChange={(e) => setDinasId(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            required
          >
            {dinasList.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
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
          {file && <p className="mt-1 text-sm text-gray-500">File terpilih: {file.name}</p>}
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
  )
}