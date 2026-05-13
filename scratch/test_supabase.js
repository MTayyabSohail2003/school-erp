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
    const email = 'test_parent_' + Date.now() + '@example.com';
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
        console.log('Success:', authData);
        // clean up
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    }
}

run();
