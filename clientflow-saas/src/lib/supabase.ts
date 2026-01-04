import { createClient } from '@supabase/supabase-js';

// Use environment variables or hardcode for testing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://spktkqkjquowfpkayevz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwa3RrcWtqcXVvd2Zwa2F5ZXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTEyMDcsImV4cCI6MjA4Mjg4NzIwN30.w_9AQ0CVyH50u4nGk0MWHS1b7WzvLTpWAp6qa11VyEs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
