// src/lib/auth.ts
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const supabase = createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const supabase = createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return profile;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(role: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== role) {
    redirect('/dashboard');
  }
  return profile;
}