import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

export const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function deleteAllUsers() {
  await supabase.from('users').delete();
}

export async function updateAllPosts() {
  await supabase.from('posts').update({ status: 'archived' });
}

export function checkAdmin() {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  return isAdmin;
}

console.log('App initialized');

// TODO: fix this later
// FIXME: this is broken
