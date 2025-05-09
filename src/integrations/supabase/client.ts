import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://llimurqnjsophpdzpxma.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaW11cnFuanNvcGhwZHpweG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMjA4MTUsImV4cCI6MjA1OTY5NjgxNX0.B3-XGipe1oZcgEEwDIKLVTrKVvRbky69-74l1856SqU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);