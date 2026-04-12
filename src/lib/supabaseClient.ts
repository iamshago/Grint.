import { createClient } from '@supabase/supabase-js'

// On récupère les clés que tu as mises dans le fichier .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)