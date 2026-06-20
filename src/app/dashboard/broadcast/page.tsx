'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Dinas {
  id: string
  nama: string
  singkatan: string
}

export default function BroadcastPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetDinas, setTargetDinas] = useState<string[]>([]) // array ID dinas yang dipilih
  const [dinasList, setDinasList] = useState<Dinas[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  })
  const router = useRouter()
  const supabase = createClient()

  // Ambil daftar dinas
  useEffect(() => {
    const fetchDinas = async () => {
      const { data, error } = await supabase.from('dinas').select('*').order('nama')
      if (!error && data) {
        setDinasList(data)
      }
    }
    fetchDinas()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: null, message: '' })

    if (!title.trim() || !content.trim()) {
      setStatus({ type: 'error', message: 'Judul dan konten wajib diisi.' })
      setLoading(false)
      return
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      target_dinas_ids: targetDinas, // array UUID, kosong berarti semua dinas
    }

    const res = await fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await res.json()

    if (res.ok) {
      setStatus({ type: 'success', message: 'Pengumuman berhasil dikirim!' })
      setTitle('')
      setContent('')
      setTargetDinas([])
      // Redirect ke halaman daftar pengumuman setelah 2 detik
      setTimeout(() => router.push('/dashboard/announcements'), 2000)
    } else {
      setStatus({ type: 'error', message: result.error || 'Gagal mengirim pengumuman.' })
    }
    setLoading(false)
  }

  const toggleDinas = (id: string) => {
    setTargetDinas(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (targetDinas.length === dinasList.length) {
      setTargetDinas([])
    } else {
      setTargetDinas(dinasList.map(d => d.id))
    }
  }

  const isAllSelected = targetDinas.length === dinasList.length && dinasList.length > 0

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kirim Broadcast</h1>
      <p className="text-gray-600 mb-8">
        Kirim pengumuman ke seluruh dinas atau pilih dinas tertentu.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Judul */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Judul Pengumuman <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Masukkan judul pengumuman"
            required
          />
        </div>

        {/* Konten */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Isi Pengumuman <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Tulis isi pengumuman di sini..."
            required
          />
        </div>

        {/* Pilih Dinas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Target Dinas (opsional)
            </label>
            <button
              type="button"
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Kosongkan pilihan untuk mengirim ke semua dinas.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
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
          {targetDinas.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Akan dikirim ke semua dinas.
            </p>
          )}
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
          {loading ? 'Mengirim...' : 'Kirim Pengumuman'}
        </button>
      </form>
    </div>
  )
}