// src/app/api/absensi/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'excel';
  const filterDinas = searchParams.get('dinas') || '';
  const filterStatus = searchParams.get('status') || '';
  const filterUser = searchParams.get('user') || '';
  const filterTanggal = searchParams.get('tanggal') || '';
  const searchQuery = searchParams.get('search') || '';

  const supabase = createServerComponentClient();

  // Build query
  let query = supabase
    .from('absensi')
    .select(`
      *,
      profiles:user_id (
        name,
        role,
        dinas:dinas_id (
          nama
        )
      )
    `)
    .order('check_in_time', { ascending: false });

  // Filter by dinas
  if (filterDinas) {
    query = query.eq('dinas_id', filterDinas);
  }

  // Filter by status
  if (filterStatus) {
    query = query.eq('status', filterStatus);
  }

  // Filter by user
  if (filterUser) {
    query = query.eq('user_id', filterUser);
  }

  // Filter by date
  if (filterTanggal) {
    query = query.eq('tanggal', filterTanggal);
  }

  const { data: absensiRecords, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data absensi' }, { status: 500 });
  }

  let records = (absensiRecords || []) as any[];

  // Search filter (client-side because profiles is a nested relation)
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    records = records.filter(
      (item: any) =>
        item.profiles?.name?.toLowerCase().includes(q) ||
        item.profiles?.dinas?.nama?.toLowerCase().includes(q)
    );
  }

  const data = records.map((record: any) => ({
    'Nama User': record.profiles?.name || 'Tidak Diketahui',
    'Dinas': record.profiles?.dinas?.nama || '-',
    'Tanggal': record.tanggal || '-',
    'Waktu Check-in': record.check_in_time
      ? new Date(record.check_in_time).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-',
    'Status':
      record.status === 'hadir'
        ? 'Hadir'
        : record.status === 'izin'
        ? 'Izin'
        : record.status === 'sakit'
        ? 'Sakit'
        : record.status || '-',
    'Lokasi':
      record.latitude && record.longitude
        ? `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`
        : '-',
  }));

  if (format === 'excel') {
    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi');

    // Auto-fit column widths
    const colWidths = [
      { wch: 25 }, // Nama User
      { wch: 25 }, // Dinas
      { wch: 15 }, // Tanggal
      { wch: 25 }, // Waktu Check-in
      { wch: 12 }, // Status
      { wch: 30 }, // Lokasi
    ];
    worksheet['!cols'] = colWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="absensi-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  }

  if (format === 'pdf') {
    // Generate HTML table for PDF conversion
    const rows = data
      .map(
        (item: any) => `
      <tr>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item['Nama User']}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item['Dinas']}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item['Tanggal']}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item['Waktu Check-in']}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:center;font-size:12px">${item['Status']}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item['Lokasi']}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Laporan Absensi</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1e3a5f; font-size: 20px; margin-bottom: 5px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e3a5f; color: white; padding: 10px 8px; text-align: left; font-size: 12px; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Laporan Absensi</h1>
        <p class="subtitle">Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</p>
        <table>
          <thead>
            <tr>
              <th>Nama User</th>
              <th>Dinas</th>
              <th>Tanggal</th>
              <th>Waktu Check-in</th>
              <th>Status</th>
              <th>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <p style="margin-top:20px;font-size:10px;color:#999;text-align:center;">
          Laporan ini digenerate otomatis dari Sistem Labusel Gov
        </p>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="absensi-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  }

  return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 });
}