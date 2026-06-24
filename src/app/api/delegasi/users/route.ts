// app/api/delegasi/users/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'gubernur') {
      return NextResponse.json({ error: 'Hanya Bupati yang dapat mengakses' }, { status: 403 });
    }

    // Ambil semua user yang bukan bupati
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .neq('role', 'gubernur')
      .order('full_name', { ascending: true });

    // Ambil daftar target_user_id yang sudah menjadi delegasi
    const { data: existingDelegations } = await supabase
      .from('delegasi')
      .select('target_user_id');

    const delegatedIds = new Set(existingDelegations?.map((d: any) => d.target_user_id) || []);

    // Filter: hanya user yang belum menjadi delegasi
    const availableUsers = (allUsers || []).filter((u: any) => !delegatedIds.has(u.id));

    return NextResponse.json({ data: availableUsers }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}