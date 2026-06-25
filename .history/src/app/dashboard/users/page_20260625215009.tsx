// app/dashboard/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  dinas_id: string | null;
  dinas?: { nama: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        dinas:dinas_id (
          nama
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setUsers((data as any[]) || []);
    }
    setLoading(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return;

    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  function getRoleBadge(role: string) {
    const styles: Record<string, string> = {
      gubernur: 'bg-purple-100 text-purple-800',
      kepala_dinas: 'bg-blue-100 text-blue-800',
      staf: 'bg-gray-100 text-gray-800',
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  }

  function getRoleLabel(role: string) {
    return role === 'gubernur' ? 'Bupati' :
           role === 'kepala_dinas' ? 'Kepala Dinas' :
           'Staf';
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kelola Pengguna</h1>
          <p className="text-sm text-gray-600 mt-1">
            Daftar semua pengguna di sistem Labusel Gov
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <h3 className="font-medium text-gray-900 truncate">{user.name || '-'}</h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getRoleBadge(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600 truncate">
                {user.dinas?.nama || '-'}
              </span>
              <button
                onClick={() => handleDelete(user.id)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Belum ada pengguna terdaftar.</p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Dinas</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name || '-'}</td>
                  <td className="px-6 py-4 text-gray-700">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{user.dinas?.nama || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Belum ada pengguna terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}