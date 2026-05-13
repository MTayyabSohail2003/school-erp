const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function run() {
    const email = 'unconfirmed_' + Date.now() + '@example.com';
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: false,
    });
    
    console.log('First create:', authError ? authError.message : 'Success');
    
    // Now try to create it again with email_confirm: true
    const { data: authData2, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true,
    });
    
    console.log('Second create:', authError2 ? authError2.message : 'Success');
    
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
}

run();
