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
    const email = 'test_parent_duplicate@example.com';
    
    // First create
    await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Parent',
            role: 'PARENT',
        },
    });

    // Second create (duplicate)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Parent',
            role: 'PARENT',
        },
    });

    if (authError) {
        console.error('Auth Error:', authError.message);
    } else {
        console.log('Success 2:', authData);
    }
}

run();
