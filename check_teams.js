import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://onfogbapyfqjadhvomgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZm9nYmFweWZxamFkaHZvbWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTgxMjMsImV4cCI6MjA4NzIzNDEyM30.psbuHbhHm2erF7p4ZG5Hs4RQ8rmTs9aDnftpCeHVAFg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTeams() {
    console.log('--- Checking Teams ---');
    const { data, error } = await supabase.from('teams').select('id, name, username');
    console.log('Teams:', data);
    if (error) console.error('Error:', error.message);
}
checkTeams();
