import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://onyibiwnfwxatadlkygz.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWliaXduZnd4YXRhZGxreWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTA5NzIsImV4cCI6MjA0NzQyNjk3Mn0.fSowEy_-abbGvLM0_A17SiORxgWqAc1G4mV1w7v3d28'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
