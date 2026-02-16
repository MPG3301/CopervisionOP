
import { createClient } from '@supabase/supabase-js';

// Credentials from your screenshot
const supabaseUrl = 'https://zcyorlvdjibgsndzacwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeW9ybHZkamliZ3NuZHphY3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzM0NDIsImV4cCI6MjA4Njc0OTQ0Mn0.GbDT_BhPFI9QfEoDrZWr23Pfm3hgax6hBtOgkiaHcqM'; // Replace with your full key from the 'Copy' button

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
