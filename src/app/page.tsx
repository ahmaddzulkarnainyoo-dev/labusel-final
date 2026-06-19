// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">Labusel</span>
              <span className="text-sm font-medium text-gray-500">Gov</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Login
              </Link>
              <Link
                href="/aduan"
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                Buat Aduan
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Platform Digital{' '}
          <span className="text-blue-600">Pemerintahan</span>
          <br />
          Labuhanbatu Selatan
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
          Informasi, laporan, dan aduan masyarakat terintegrasi dalam satu
          ekosistem digital yang transparan dan responsif.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow-lg hover:bg-blue-700 transition"
          >
            Masuk ke Dashboard
          </Link>
          <Link
            href="/aduan"
            className="px-6 py-3 bg-white text-blue-600 font-medium border border-blue-600 rounded-xl hover:bg-blue-50 transition"
          >
            Laporkan Aduan
          </Link>
        </div>
      </section>

      {/* Fitur */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Fitur Utama
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Broadcast</h3>
              <p className="mt-2 text-gray-600">
                Gubernur dapat mengirim pengumuman ke seluruh dinas atau target tertentu.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Laporan</h3>
              <p className="mt-2 text-gray-600">
                Kepala Dinas dan staf dapat mengirim laporan terstruktur atau bebas dengan lampiran.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Aduan Masyarakat</h3>
              <p className="mt-2 text-gray-600">
                Masyarakat dapat melapor tanpa login, dengan AI yang otomatis mengkategorikan aduan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Pemerintah Kabupaten Labuhanbatu Selatan.
      </footer>
    </div>
  );
}