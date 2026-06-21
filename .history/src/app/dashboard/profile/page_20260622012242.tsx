// app/dashboard/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [dinasName, setDinasName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const router = useRouter();
  const supabase = createClient();

  // State untuk ganti password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, dinas:nama')
        .eq('id', user.id)
        .single();

      if (profile) {
        setName(profile.name || '');
        setRole(profile.role || '');
        setDinasName(profile.dinas?.nama || '-');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setStatus({ type: null, message: '' });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus({ type: 'error', message: 'User tidak ditemukan.' });
      setUpdating(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ name: name })
      .eq('id', user.id);

    if (error) {
      setStatus({ type: 'error', message: 'Gagal update profil: ' + error.message });
    } else {
      setStatus({ type: 'success', message: 'Profil berhasil diupdate!' });
    }
    setUpdating(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', message: 'Password baru dan konfirmasi tidak cocok.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', message: 'Password minimal 6 karakter.' });
      return;
    }

    setPasswordMessage({ type: null, message: '' });

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordMessage({ type: 'error', message: 'Gagal ganti password: ' + error.message });
    } else {
      setPasswordMessage({ type: 'success', message: 'Password berhasil diganti!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profil Saya</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kartu Informasi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akun</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-gray-900">{email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Role</dt>
              <dd className="text-gray-900 capitalize">{role.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Dinas</dt>
              <dd className="text-gray-900">{dinasName}</dd>
            </div>
          </dl>
        </div>

        {/* Form Update Nama */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Nama</h2>
          <form onSubmit={handleUpdateProfile}>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
            {status.type && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {status.message}
              </div>
            )}
            <button
              type="submit"
              disabled={updating}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>

      {/* Form Ganti Password */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ganti Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Password Baru
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Konfirmasi Password Baru
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
            {passwordMessage.type && (
              <div className={`p-3 rounded-lg text-sm ${
                passwordMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {passwordMessage.message}
              </div>
            )}
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
            >
              Ganti Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}