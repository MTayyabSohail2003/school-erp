
import { createClient } from './lib/supabase/client';

async function checkTables() {
    const supabase = createClient();
    const { data: years, error: yError } = await supabase.from('academic_years').select('*').limit(1);
    const { data: terms, error: tError } = await supabase.from('academic_terms').select('*').limit(1);
    
    console.log('academic_years:', yError ? 'Missing' : 'Exists');
    console.log('academic_terms:', tError ? 'Missing' : 'Exists');
}

checkTables();
