// app/dashboard/gubernur/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function BupatiDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [showDinasChart, setShowDinasChart] = useState(false);

  useEffect(() => {
    requireRole('gubernur');
    fetchData();
  }, []);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);

    const { data: reportsRaw } = await supabase
      .from('reports')
      .select(`
        id,
        title,
        status,
        created_at,
        profiles:created_by (
          full_name,
          dinas_id,
          dinas:dinas_id (
            nama
          )
        )
      `)
      .order('created_at', { ascending: false });

    setReports(reportsRaw || []);
    setLoading(false);
  }

  const totalReports = reports?.length || 0;
  const unreadReports = reports?.filter((r) => r.status === 'unread').length || 0;

  const dinasMap = new Map();
  reports?.forEach((report) => {
    const dinasName = report.profiles?.dinas?.nama || 'Tidak Diketahui';
    dinasMap.set(dinasName, (dinasMap.get(dinasName) || 0) + 1);
  });
  const dinasStats = Array.from(dinasMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const latestReports = reports?.slice(0, 5) || [];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 5);

  const reportsPerMonth = (reports || []).filter((r) => new Date(r.created_at) >= sixMonthsAgo)
    .reduce((acc, r) => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const chartData: { month: string; count: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    chartData.unshift({
      month: months[d.getMonth()],
      count: reportsPerMonth[key] || 0,
    });
  }

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const totalThisMonth = (reports || []).filter((r) => {
    const d = new Date(r.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const totalLastMonth = (reports || []).filter((r) => {
    const d = new Date(r.created_at);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  }).length;

  let percentageChange = 0;
  if (totalLastMonth > 0) {
    percentageChange = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
  } else if (totalThisMonth > 0) {
    percentageChange = 100;
  }

  const maxChartCount = Math.max(...chartData.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h