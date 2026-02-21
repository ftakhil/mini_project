import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://onfogbapyfqjadhvomgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZm9nYmFweWZxamFkaHZvbWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTgxMjMsImV4cCI6MjA4NzIzNDEyM30.psbuHbhHm2erF7p4ZG5Hs4RQ8rmTs9aDnftpCeHVAFg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testJoin() {
    console.log('--- Testing Join ---');
    const { data, error } = await supabase
        .from('contracts')
        .select(`*, companies(name)`)
        .limit(1);

    if (error) {
        console.error('Error with companies(name):', error.message);
        console.log('Trying with client_id relationship...');
        const { data: data2, error: error2 } = await supabase
            .from('contracts')
            .select(`*, companies!contracts_client_id_fkey(name)`)
            .limit(1);
        if (error2) {
            console.error('Error with relationship name:', error2.message);
        } else {
            console.log('Success with !fkey syntax:', data2[0]);
        }
    } else {
        console.log('Success with companies(name):', data[0]);
    }
}
testJoin();
