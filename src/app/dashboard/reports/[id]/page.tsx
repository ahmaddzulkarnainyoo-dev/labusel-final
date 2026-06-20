// app/dashboard/reports/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Report {
  id: string;
  title: string;
  content: string;
  type: string;
  attachment_url: string | null;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  };
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:created_by (
            full_name,
            role
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        setStatus({ type: 'error', message: 'Gagal memuat laporan.' });
      } else {
        setReport(data);
        // Tandai sebagai sudah dibaca
        if (data.status === 'unread') {
          await supabase
            .from('reports')
            .update({ status: 'read' })
            .eq('id', id);
          setReport({ ...data, status: 'read' });
        }
      }
      setLoading(false);
    };

    if (id) fetchReport();
  }, [id, supabase]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      setStatus({ type: 'error', message: 'Gagal update status.' });
    } else {
      setReport(prev => prev ? { ...prev, status: newStatus } : null);
      setStatus({ type: 'success', message: 'Status berhasil diupdate.' });
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Memuat laporan...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Laporan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Oleh: {report.profiles?.full_name || 'Unknown'} •{' '}
            {report.profiles?.role === 'kepala_dinas' ? 'Kepala Dinas' : 'Staf'} •{' '}
            {new Date(report.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          report.status === 'read' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {report.status === 'read' ? 'Sudah Dibaca' : 'Belum Dibaca'}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Mode Laporan</h3>
          <p className="text-gray-900 capitalize">{report.type === 'structured' ? 'Terstruktur' : 'Bebas'}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Isi Laporan</h3>
          <div className="mt-2 prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {report.content}
          </div>
        </div>

        {report.attachment_url && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Lampiran</h3>
            <a
              href={report.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
            >
              📎 Download Lampiran
            </a>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Update Status</h3>
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusChange('read')}
              disabled={updating || report.status === 'read'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Tandai Sudah Dibaca
            </button>
            <button
              onClick={() => handleStatusChange('unread')}
              disabled={updating || report.status === 'unread'}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Tandai Belum Dibaca
            </button>
          </div>
          {status.type && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {status.message}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => router.push('/dashboard/reports')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Kembali ke Daftar Laporan
          </button>
        </div>
      </div>
    </div>
  );
}