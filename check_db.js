import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://onfogbapyfqjadhvomgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZm9nYmFweWZxamFkaHZvbWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTgxMjMsImV4cCI6MjA4NzIzNDEyM30.psbuHbhHm2erF7p4ZG5Hs4RQ8rmTs9aDnftpCeHVAFg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStructure() {
    console.log('--- Checking Contracts ---');
    const { data: cData, error: cErr } = await supabase.from('contracts').select('*').limit(1);
    console.log('Contract sample:', cData ? cData[0] : 'No data');
    if (cErr) console.error('Contract error:', cErr.message);

    console.log('\n--- Checking Companies ---');
    const { data: compData, error: compErr } = await supabase.from('companies').select('*').limit(1);
    console.log('Company sample:', compData ? compData[0] : 'No data');
    if (compErr) console.error('Company error:', compErr.message);
}
checkStructure();
