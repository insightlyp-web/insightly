// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wekemzpplaowqdxyjgmt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTc3MDYsImV4cCI6MjA3NzI5MzcwNn0.3LBnE7J7eUJFAKZYwjMAKteQCnTd8k19C8W1YiSUFu0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

