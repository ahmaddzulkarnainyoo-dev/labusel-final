// app/aduan/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function AduanPage() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    kategori: '',
    pesan: '',
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ kode_tiket: string } | null>(null);

  // Generate CAPTCHA on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaNum1(num1);
    setCaptchaNum2(num2);
    setCaptchaAnswer('');
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFoto(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate CAPTCHA client-side
    const expected = captchaNum1 + captchaNum2;
    if (parseInt(captchaAnswer) !== expected) {
      setError('Jawaban CAPTCHA salah');
      setLoading(false);
      generateCaptcha();
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('nama', formData.nama);
      formPayload.append('email', formData.email);
      formPayload.append('kategori', formData.kategori);
      formPayload.append('pesan', formData.pesan);
      formPayload.append('captcha_answer', captchaAnswer);
      formPayload.append('captcha_expected', String(expected));
      if (foto) {
        formPayload.append('foto', foto);
      }

      const res = await fetch('/api/aduan', {
        method: 'POST',
        body: formPayload,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim aduan');
        generateCaptcha();
        return;
      }

      setSuccess({ kode_tiket: data.kode_tiket });
      setFormData({ nama: '', email: '', kategori: '', pesan: '' });
      setFoto(null);
    } catch (err: any) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSuccess(null);
    generateCaptcha();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xl font-bold text-blue-600">Labusel</span>
            <span className="text-sm text-gray-500">Gov</span>
          </div>
          <nav className="flex space-x-6 text-sm">
            <a href="/" className="text-gray-600 hover:text-blue-600">Beranda</a>
            <a href="/aduan" className="text-blue-600 font-medium">Aduan Masyarakat</a>
            <a href="/cek-status" className="text-gray-600 hover:text-blue-600">Cek Status</a>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Success Modal */}
        {success && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Aduan Terkirim!</h2>
              <p className="text-gray-600 mb-6">Simpan kode tiket ini untuk memantau status aduan Anda.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-600 font-medium mb-1">Kode Tiket</p>
                <p className="text-2xl font-bold text-blue-700 tracking-wider">{success.kode_tiket}</p>
              </div>
              <button
                onClick={resetForm}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Kirim Aduan Lainnya
              </button>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Aduan Masyarakat Labusel</h1>
        <p className="text-gray-600 mb-8">
          Sampaikan kritik, saran, atau laporan Anda kepada Pemerintah Kabupaten Labuhanbatu Selatan. 
          Setiap aduan akan mendapat kode tiket untuk memantau status.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Nama Lengkap */}
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="contoh@email.com"
            />
          </div>

          {/* Kategori */}
          <div>
            <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              id="kategori"
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            >
              <option value="">Pilih kategori</option>
              <option value="Infrastruktur">Infrastruktur</option>
              <option value="Pelayanan Publik">Pelayanan Publik</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Lingkungan">Lingkungan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Pesan */}
          <div>
            <label htmlFor="pesan" className="block text-sm font-medium text-gray-700 mb-1">
              Pesan Aduan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="pesan"
              name="pesan"
              value={formData.pesan}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-y"
              placeholder="Tuliskan aduan Anda secara detail..."
            />
          </div>

          {/* Upload Foto */}
          <div>
            <label htmlFor="foto" className="block text-sm font-medium text-gray-700 mb-1">
              Upload Foto (opsional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="foto" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Upload file</span>
                    <input
                      id="foto"
                      name="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
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

          {/* CAPTCHA */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verifikasi Keamanan <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Berapa <span className="font-bold text-blue-600">{captchaNum1}</span> +{' '}
              <span className="font-bold text-blue-600">{captchaNum2}</span>?
            </p>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Jawab"
              />
              <button
                type="button"
                onClick={generateCaptcha}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Ganti soal
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Kirim Aduan</span>
              </>
            )}
          </button>
        </form>
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