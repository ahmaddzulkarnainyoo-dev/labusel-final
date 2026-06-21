// app/dashboard/absensi/staf/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';

export default function StafAbsensiPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [history, setHistory] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const supabase = createClient();
  const router = useRouter();

  // Ambil riwayat absen sendiri
  useEffect(() => {
    const fetchHistory = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('absensi')
        .select('*')
        .eq('user_id', userId)
        .order('check_in_time', { ascending: false })
        .limit(10);
      if (data) setHistory(data);
    };
    fetchHistory();
  }, []);

  // Dapatkan lokasi GPS
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Jika user menolak, tetap bisa absen tanpa lokasi
          setLocation(null);
        }
      );
    }
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPhoto(imageSrc);
        setIsCameraOpen(false);
      }
    }
  };

  const handleAbsen = async () => {
    if (!photo) {
      setStatus({ type: 'error', message: 'Ambil foto terlebih dahulu.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    // Kirim ke API
    const res = await fetch('/api/absensi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photo_base64: photo,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        status: 'hadir',
      }),
    });

    const result = await res.json();

    if (res.ok) {
      setStatus({ type: 'success', message: 'Absen berhasil!' });
      setPhoto(null);
      // Refresh riwayat
      const { data: currentUser } = await supabase.auth.getUser();
      const currentUserId = currentUser?.user?.id;
      if (currentUserId) {
        const { data } = await supabase
          .from('absensi')
          .select('*')
          .eq('user_id', currentUserId)
          .order('check_in_time', { ascending: false })
          .limit(10);
        if (data) setHistory(data);
      }
    } else {
      setStatus({ type: 'error', message: result.error || 'Gagal absen.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Absensi</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-blue-600"
        >
          ← Kembali
        </button>
      </div>

      {/* Tombol Absen */}
      <button
        onClick={() => {
          setIsCameraOpen(true);
          getLocation();
        }}
        className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition"
      >
        📸 Absen Sekarang
      </button>

      {/* Modal Kamera */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user' }}
              className="w-full rounded-lg"
            />
            <div className="flex gap-4 mt-4 justify-center">
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg"
              >
                📷 Ambil Foto
              </button>
              <button
                onClick={() => setIsCameraOpen(false)}
                className="px-6 py-3 bg-gray-600 text-white rounded-full"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Foto & Submit */}
      {photo && !isCameraOpen && (
        <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview Foto:</p>
          <img src={photo} alt="Foto absen" className="w-full rounded-lg mb-3" />
          <button
            onClick={handleAbsen}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : '✅ Konfirmasi Absen'}
          </button>
          <button
            onClick={() => setPhoto(null)}
            className="w-full mt-2 py-2 text-sm text-gray-500"
          >
            Ambil Ulang
          </button>
        </div>
      )}

      {/* Status */}
      {status.type && (
        <div className={`mt-4 p-4 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {status.message}
        </div>
      )}

      {/* Riwayat Absen */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Absen</h2>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(item.check_in_time).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.check_in_time).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {item.status}
                  </span>
                </div>
                {item.photo_url && (
                  <img src={item.photo_url} alt="Foto absen" className="mt-2 w-16 h-16 rounded-lg object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Belum ada riwayat absen.</p>
        )}
      </div>
    </div>
  );
}