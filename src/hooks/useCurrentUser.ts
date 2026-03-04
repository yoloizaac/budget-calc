import { supabase } from '@/integrations/supabase/client';

export async function getCurrentUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');
  return session.user.id;
}
