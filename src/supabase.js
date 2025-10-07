// src/supabase.js
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Paste your URL and Anon Key from the Supabase dashboard
const supabaseUrl = 'https://rbbxuryjrogmlotaraeh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYnh1cnlqcm9nbWxvdGFyYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjIxNzMsImV4cCI6MjA3NTQzODE3M30.OysRWwDG3EJwcDMsJp6JlzUYDv57Xas5oHiHMdV_EvY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);