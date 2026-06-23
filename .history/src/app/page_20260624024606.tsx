'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AOS from 'aos';

// Heroicons imports
import {
  MegaphoneIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// --- Counter Component ---
function Counter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="text-4xl font-bold text-blue-600">
      {count}
      {suffix}
    </div>
  );
}

// --- Bar Chart Component ---
function BarChart() {
  const data = [
    { label: 'Dinas Pendidikan', value: 85 },
    { label: 'Dinas Kesehatan', value: 72 },
    { label: 'Dinas PUPR', value: 60 },
    { label: 'Dinas Pertanian', value: 48 },
    { label: 'Dinas Sosial', value: 35 },
  ];
  const max = 100;

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-32 text-sm text-gray-600 text-right shrink-0">{item.label}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-1000"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 w-10">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        setShowSplash(false);
        document.body.style.overflow = '';
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  if (showSplash) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0B1A33 0%, #1A3A6B 100%)' }}
      >
        <div
          className="animate-[fadeInScale_1.5s_ease-out_forwards]"
          style={{ animation: 'fadeInScale 1.5s ease-out forwards' }}
        >
          <Image
            src="/images/logo.png"
            alt="Labusel"
            width={256}
            height={256}
            className="w-48 md:w-64 h-auto shadow-xl rounded-2xl border-4 border-white/20"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">

      {/* ===== 1. HERO SECTION ===== */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B1A33 0%, #1A3A6B 100%)' }}
      >
        {/* Navbar */}
        <nav className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Labusel"
                width={40}
                height={40}
                className="h-10 w-auto rounded"
              />
              <span className="text-white font-semibold text-lg">Labusel Gov</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-white hover:underline text-sm font-medium transition"
              >
                Login
              </Link>
              <Link
                href="/aduan"
                className="text-white hover:underline text-sm font-medium transition"
              >
                Buat Aduan
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div data-aos="fade-up" data-aos-duration="1000">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Platform Digital Pemerintahan
              <br />
              <span className="text-blue-200">Kabupaten Labuhanbatu Selatan</span>
            </h1>
            <p className="mt-4 text-xl text-blue-200 italic">
              &ldquo;Santun Berkata, Bijak Berkarya&rdquo;
            </p>
            <p className="mt-6 text-lg text-gray-200 max-w-2xl mx-auto">
              Efisiensi, transparansi, dan responsivitas dalam satu ekosistem digital untuk Gubernur, dinas, dan masyarakat.
            </p>
          </div>
          <div
            className="mt-10 flex flex-wrap justify-center gap-4"
            data-aos="fade-up"
            data-aos-delay="300"
            data-aos-duration="1000"
          >
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Masuk Dashboard
            </Link>
            <Link
              href="/aduan"
              className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition"
            >
              Buat Aduan
            </Link>
          </div>
        </div>

        {/* Decorative bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ===== 2. TENTANG LABUSEL ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Tentang Labuhanbatu Selatan
          </h2>
          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Map */}
            <div
              data-aos="fade-right"
              data-aos-duration="800"
              className="shadow-xl rounded-2xl border border-gray-200 overflow-hidden hover:scale-[1.02] transition-transform duration-300"
            >
              <Image
                src="/images/peta-labusel.jpg"
                alt="Peta Labuhanbatu Selatan"
                width={600}
                height={500}
                className="w-full h-auto"
              />
            </div>

            {/* Data Cards */}
            <div
              className="grid grid-cols-2 gap-4"
              data-aos="fade-left"
              data-aos-duration="800"
            >
              {[
                { label: 'Ibu Kota', value: 'Kota Pinang' },
                { label: 'Tahun Berdiri', value: '24 Juni 2008' },
                { label: 'Luas Wilayah', value: '±3.596 km²' },
                { label: 'Jumlah Penduduk', value: '±332.459 jiwa' },
                { label: 'Motto', value: 'Santun Berkata, Bijak Berkarya' },
                { label: 'Kecamatan', value: '5 Kecamatan' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center"
                >
                  <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                  <div className="font-semibold text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. FITUR UTAMA PLATFORM ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            Satu Platform, Tiga Fungsi Inti
          </h2>
          <p className="mt-3 text-gray-600 text-center max-w-2xl mx-auto">
            Dirancang untuk mempercepat alur informasi dan pengambilan keputusan.
          </p>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition"
              data-aos="fade-up"
              data-aos-delay="0"
            >
              <MegaphoneIcon className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">Broadcast</h3>
              <p className="mt-2 text-gray-600">
                Gubernur mengirim pengumuman ke seluruh dinas atau target tertentu secara instan.
              </p>
            </div>
            {/* Card 2 */}
            <div
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <DocumentTextIcon className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">Laporan</h3>
              <p className="mt-2 text-gray-600">
                Kepala Dinas dan staf mengirim laporan terstruktur atau bebas dengan lampiran.
              </p>
            </div>
            {/* Card 3 */}
            <div
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">Aduan Masyarakat</h3>
              <p className="mt-2 text-gray-600">
                Publik melapor tanpa login, AI otomatis mengkategorikan dan merangkum aduan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. STATISTIK DINAMIS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Dampak Platform
          </h2>

          {/* Counter Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200" data-aos="fade-up" data-aos-delay="0">
              <Counter target={20} suffix="+" />
              <div className="text-sm text-gray-500 mt-1">Dinas Terintegrasi</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200" data-aos="fade-up" data-aos-delay="100">
              <Counter target={100} suffix="+" />
              <div className="text-sm text-gray-500 mt-1">Laporan Terkirim</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200" data-aos="fade-up" data-aos-delay="200">
              <Counter target={50} suffix="+" />
              <div className="text-sm text-gray-500 mt-1">Pengumuman Dikirim</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200" data-aos="fade-up" data-aos-delay="300">
              <Counter target={24} suffix=" Jam" />
              <div className="text-sm text-gray-500 mt-1">Akses Publik</div>
            </div>
          </div>

          {/* Bar Chart */}
          <div data-aos="fade-up" data-aos-duration="800">
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
              Laporan per Dinas (Teratas)
            </h3>
            <div className="max-w-2xl mx-auto">
              <BarChart />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. FILOSOFI & NILAI PLATFORM ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            Mengapa Labusel Gov?
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-gray-600 text-center">
            Platform ini lahir dari kebutuhan akan pemerintahan yang lebih cepat, terbuka, dan akuntabel. Dengan integrasi broadcast, laporan, dan aduan, seluruh proses pemerintahan menjadi lebih terstruktur dan terukur.
          </p>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="text-center" data-aos="fade-up" data-aos-delay="0">
              <EyeIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Transparan</h3>
              <p className="mt-2 text-sm text-gray-500">
                Setiap pengumuman, laporan, dan aduan tercatat dan dapat dilacak.
              </p>
            </div>
            {/* Value 2 */}
            <div className="text-center" data-aos="fade-up" data-aos-delay="100">
              <ClockIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Efisien</h3>
              <p className="mt-2 text-sm text-gray-500">
                Alur informasi dari Gubernur hingga masyarakat menjadi lebih singkat.
              </p>
            </div>
            {/* Value 3 */}
            <div className="text-center" data-aos="fade-up" data-aos-delay="200">
              <ArrowPathIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Responsif</h3>
              <p className="mt-2 text-sm text-gray-500">
                Aduan masyarakat diproses dengan bantuan AI untuk penanganan cepat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. CTA BESAR ===== */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(135deg, #1A3A6B 0%, #0B1A33 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white" data-aos="fade-up">
            Siap bergabung dengan ekosistem digital Labusel?
          </h2>
          <div
            className="mt-8 flex flex-wrap justify-center gap-4"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-blue-700 font-medium rounded-lg hover:bg-gray-100 transition shadow-lg"
            >
              Masuk Dashboard
            </Link>
            <Link
              href="/aduan"
              className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition"
            >
              Buat Aduan
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 7. FOOTER ===== */}
      <footer className="py-10" style={{ backgroundColor: '#0B1A33' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Labusel"
                width={32}
                height={32}
                className="h-8 w-auto rounded"
              />
              <span className="text-white font-semibold">Labusel Gov</span>
            </div>
            <div className="text-gray-400 text-sm text-center">
              &copy; 2026 Pemerintah Kabupaten Labuhanbatu Selatan
            </div>
            <div className="flex gap-4 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition">
                Kebijakan Privasi
              </Link>
              <span className="text-gray-600">|</span>
              <Link href="/contact" className="text-gray-400 hover:text-white transition">
                Kontak
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}