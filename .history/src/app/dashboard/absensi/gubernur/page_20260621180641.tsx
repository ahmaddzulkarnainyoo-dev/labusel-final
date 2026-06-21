// app/dashboard/absensi/gubernur/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Dinas {
  id: string;
  nama: string;
  singkatan: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
  dinas_id: string;
}

interface Attendance {
  id: string;
  check_in_time: string;
  tanggal: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
}

export default function GubernurAbsensiPage() {
  const [dinasList, setDinasList] = useState<Dinas[]>([]);
  const [selectedDinas, setSelectedDinas] = useState<Dinas | null>(null);
  const [usersInDinas, setUsersInDinas] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // 1. Ambil semua dinas
  useEffect(() => {
    const fetchDinas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('dinas')
        .select('id, nama, singkatan')
        .order('nama', { ascending: true });

      if (error) {
        setError('Gagal memuat daftar dinas: ' + error.message);
      } else {
        setDinasList(data || []);
      }
      setLoading(false);
    };
    fetchDinas();
  }, [supabase]);

  // 2. Saat dinas dipilih, ambil daftar user di dinas tersebut
  useEffect(() => {
    if (!selectedDinas) {
      setUsersInDinas([]);
      return;
    }

    const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, dinas_id')
        .eq('dinas_id', selectedDinas.id)
        .in('role', ['kepala_dinas', 'staf'])
        .order('role', { ascending: false }) // kepala_dinas dulu, baru staf
        .order('full_name', { ascending: true });

      if (error) {
        setError('Gagal memuat daftar user: ' + error.message);
      } else {
        setUsersInDinas(data || []);
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, [selectedDinas, supabase]);

  // 3. Ambil riwayat absen user tertentu
  const fetchAttendance = async (userId: string) => {
    const { data, error } = await supabase
      .from('absensi')
      .select('*')
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false });

    if (error) {
      alert('Gagal memuat riwayat: ' + error.message);
      return;
    }
    setAttendanceHistory(data || []);
    setShowModal(true);
  };

  // 4. Pilih dinas
  const handleSelectDinas = (dinas: Dinas) => {
    if (selectedDinas?.id === dinas.id) {
      setSelectedDinas(null); // toggle off
    } else {
      setSelectedDinas(dinas);
    }
    setSelectedUser(null);
    setShowModal(false);
  };

  // 5. Tutup modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setAttendanceHistory([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg max-w-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Absensi - Semua Dinas</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-blue-600"
        >
          ← Kembali
        </button>
      </div>

      {/* Daftar Dinas (Card Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {dinasList.map((dinas) => (
          <button
            key={dinas.id}
            onClick={() => handleSelectDinas(dinas)}
            className={`p-4 rounded-xl border-2 text-left transition ${
              selectedDinas?.id === dinas.id
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <p className="font-semibold text-gray-900 text-sm">{dinas.nama}</p>
            <p className="text-xs text-gray-500">{dinas.singkatan || ''}</p>
          </button>
        ))}
      </div>

      {/* User List (Jika dinas dipilih) */}
      {selectedDinas && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedDinas.nama}
            </h2>
            <button
              onClick={() => setSelectedDinas(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕ Tutup
            </button>
          </div>

          {loadingUsers ? (
            <p className="text-gray-500 text-sm">Memuat user...</p>
          ) : usersInDinas.length === 0 ? (
            <p className="text-gray-500 text-sm">Belum ada user di dinas ini.</p>
          ) : (
            <div className="space-y-3">
              {usersInDinas.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {user.full_name || 'Tidak Ada Nama'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role === 'kepala_dinas' ? 'Kepala Dinas' : 'Staf'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      fetchAttendance(user.id);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 active:scale-95 transition"
                  >
                    Lihat Riwayat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Riwayat Absen */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold">
                  Riwayat Absen: {selectedUser.full_name}
                </h2>
                <p className="text-xs text-gray-500 capitalize">
                  {selectedUser.role === 'kepala_dinas' ? 'Kepala Dinas' : 'Staf'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {attendanceHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">Belum ada absen.</p>
              ) : (
                <div className="space-y-4">
                  {attendanceHistory.map((item) => (
                    <div key={item.id} className="border-b border-gray-100 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
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
                          {item.latitude && item.longitude && (
                            <p className="text-xs text-gray-400 mt-1">
                              📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {item.status}
                        </span>
                      </div>
                      {item.photo_url && (
                        <img
                          src={item.photo_url}
                          alt="Foto absen"
                          className="mt-2 w-20 h-20 rounded-lg object-cover border border-gray-200"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}