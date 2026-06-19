'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="block w-full text-left px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 font-medium"
    >
      Keluar
    </button>
  );
}
