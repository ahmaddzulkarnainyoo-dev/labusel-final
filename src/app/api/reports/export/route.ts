// app/api/reports/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'excel';
  const filterDinas = searchParams.get('dinas') || '';
  const filterStatus = searchParams.get('status') || '';
  const filterTanggal = searchParams.get('tanggal') || '';
  const searchQuery = searchParams.get('search') || '';

  const supabase = createServerComponentClient();

  // Build query
  let query = supabase
    .from('reports')
    .select(`
      *,
      profiles:created_by (
        full_name,
        role,
        dinas:dinas_id (
          nama
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Filter by dinas
  if (filterDinas) {
    const { data: usersInDinas } = await supabase
      .from('profiles')
      .select('id')
      .eq('dinas_id', filterDinas);

    if (usersInDinas && usersInDinas.length > 0) {
      const userIds = usersInDinas.map((u: any) => u.id);
      query = query.in('created_by', userIds);
    } else {
      query = query.in('created_by', ['__none__']);
    }
  }

  // Filter by status
  if (filterStatus) {
    query = query.eq('status', filterStatus);
  }

  // Filter by date
  if (filterTanggal) {
    query = query.eq('created_at', filterTanggal);
  }

  // Search by title or content
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
  }

  const { data: reports, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data laporan' }, { status: 500 });
  }

  const data = (reports || []).map((report: any) => ({
    Judul: report.title,
    Pengirim: report.profiles?.full_name || 'Unknown',
    Dinas: report.profiles?.dinas?.nama || '-',
    Tanggal: new Date(report.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    Status: report.status === 'read' ? 'Sudah Dibaca' : 'Belum Dibaca',
    IsiLaporan: report.content || '',
  }));

  if (format === 'excel') {
    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

    // Auto-fit column widths
    const colWidths = [
      { wch: 40 }, // Judul
      { wch: 25 }, // Pengirim
      { wch: 25 }, // Dinas
      { wch: 25 }, // Tanggal
      { wch: 15 }, // Status
      { wch: 50 }, // IsiLaporan
    ];
    worksheet['!cols'] = colWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  }

  if (format === 'pdf') {
    // Generate HTML table for PDF conversion
    const rows = data.map((item: any) => `
      <tr>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item.Judul}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item.Pengirim}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item.Dinas}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;font-size:12px">${item.Tanggal}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:center;font-size:12px">${item.Status}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Laporan Masuk</title>
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
        <h1>Laporan Masuk</h1>
        <p class="subtitle">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <table>
          <thead>
            <tr>
              <th>Judul</th>
              <th>Pengirim</th>
              <th>Dinas</th>
              <th>Tanggal</th>
              <th>Status</th>
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
        'Content-Disposition': `inline; filename="laporan-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  }

  return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 });
}