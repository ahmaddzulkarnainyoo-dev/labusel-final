'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  full_name: string;
  role: string;
}

interface Delegasi {
  id: string;
  target_user_id: string;
  full_name: string;
  role: string;
  permissions: string[];
  created_at: string;
}

const FEATURES = [
  { key: 'broadcast', label: 'Broadcast' },
  { key: 'laporan_masuk', label: 'Laporan Masuk' },
  { key: 'kelola_user', label: 'Kelola Pengguna' },
  { key: 'laporan_absensi', label: 'Laporan Absensi' },
  { key: 'atur_penanda_kalender', label: 'Atur Penanda Kalender' },
];

const FEATURE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  FEATURES.map((f) => [f.key, f.label])
);

export default function DelegasiPage() {
  const router = useRouter();
  const [delegasiList, setDelegasiList] = useState<Delegasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<{ id: string; target_user_id: string; permissions: string[] } | null>(null);

  useEffect(() => {
    fetchDelegasi();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchDelegasi = async () => {
    try {
      const res = await fetch('/api/delegasi');
      const json = await res.json();
      if (res.ok) {
        setDelegasiList(json.data || []);
      } else {
        showNotification('error', json.error || 'Gagal memuat data');
      }
    } catch {
      showNotification('error', 'Gagal memuat data delegasi');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch('/api/delegasi/users');
      const json = await res.json();
      if (res.ok) {
        setUsers(json.data || []);
      } else {
        showNotification('error', json.error || 'Gagal memuat daftar pengguna');
      }
    } catch {
      showNotification('error', 'Gagal memuat daftar pengguna');
    }
  };

  const openAddModal = () => {
    setEditMode(null);
    setSelectedUserId('');
    setSelectedPermissions([]);
    fetchAvailableUsers();
    setShowModal(true);
  };

  const openEditModal = (item: Delegasi) => {
    setEditMode({ id: item.id, target_user_id: item.target_user_id, permissions: item.permissions });
    setSelectedUserId(item.target_user_id);
    setSelectedPermissions(item.permissions);
    fetchAvailableUsers();
    setShowModal(true);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (editMode) {
      if (selectedPermissions.length === 0) {
        showNotification('error', 'Pilih setidaknya satu fitur');
        return;
      }
      setSaving(true);
      try {
        const res = await fetch('/api/delegasi', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editMode.id, permissions: selectedPermissions }),
        });
        const json = await res.json();
        if (res.ok) {
          showNotification('success', 'Delegasi berhasil diperbarui');
          setShowModal(false);
          fetchDelegasi();
        } else {
          showNotification('error', json.error || 'Gagal memperbarui delegasi');
        }
      } catch {
        showNotification('error', 'Gagal memperbarui delegasi');
      } finally {
        setSaving(false);
      }
    } else {
      if (!selectedUserId) {
        showNotification('error', 'Pilih pengguna yang akan didelegasikan');
        return;
      }
      if (selectedPermissions.length === 0) {
        showNotification('error', 'Pilih setidaknya satu fitur');
        return;
      }
      setSaving(true);
      try {
        const res = await fetch('/api/delegasi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_user_id: selectedUserId, permissions: selectedPermissions }),
        });
        const json = await res.json();
        if (res.ok) {
          showNotification('success', 'Delegasi berhasil ditambahkan');
          setShowModal(false);
          fetchDelegasi();
        } else {
          showNotification('error', json.error || 'Gagal menambah delegasi');
        }
      } catch {
        showNotification('error', 'Gagal menambah delegasi');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus delegasi ini?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/delegasi?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        showNotification('success', 'Delegasi berhasil dihapus');
        fetchDelegasi();
      } else {
        showNotification('error', json.error || 'Gagal menghapus delegasi');
      }
    } catch {
      showNotification('error', 'Gagal menghapus delegasi');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'gubernur': return 'Bupati';
      case 'kepala_dinas': return 'Kepala Dinas';
      case 'staf': return 'Staf';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Delegasi Akses</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola pengguna yang memiliki akses seperti Bupati
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Tambah Delegasi</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {delegasiList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">Belum ada delegasi.</p>
            <button
              onClick={openAddModal}
              className="mt-3 text-sm text-blue-600 font-medium hover:underline"
            >
              Tambah Delegasi
            </button>
          </div>
        ) : (
          delegasiList.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm">{item.full_name}</h3>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                    {roleLabel(item.role)}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {item.permissions.length > 0 ? (
                    item.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium"
                      >
                        {FEATURE_LABEL_MAP[perm] || perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Tidak ada fitur</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">{formatDate(item.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fitur Diizinkan</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {delegasiList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                    Belum ada delegasi. Klik &ldquo;Tambah Delegasi&rdquo; untuk memberikan akses.
                  </td>
                </tr>
              ) : (
                delegasiList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{item.full_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {roleLabel(item.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.permissions.length > 0 ? (
                          item.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium"
                            >
                              {FEATURE_LABEL_MAP[perm] || perm}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Tidak ada</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(item.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 z-50">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editMode ? 'Edit Delegasi' : 'Tambah Delegasi'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Pilih User (hanya untuk tambah) */}
              {!editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Pengguna</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="">-- Pilih Pengguna --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({roleLabel(user.role)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pilih Fitur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Fitur yang Diizinkan</label>
                <div className="space-y-2">
                  {FEATURES.map((feature) => (
                    <label
                      key={feature.key}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(feature.key)}
                        onChange={() => togglePermission(feature.key)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                      />
                      <span className="text-sm text-gray-900 font-medium">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {editMode ? 'Simpan Perubahan' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}