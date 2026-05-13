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
    const email = 'orphan_identity@example.com';
    
    // 1. Create a user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true,
    });
    
    if (authError) {
        console.error('Initial Create Error:', authError.message);
        return;
    }
    
    console.log('Created user:', authData.user.id);
    
    // 2. We can't partially delete from auth.users via the JS client, we'd need SQL.
    // The user probably ran `reset_all_users.sql` which does: `DELETE FROM auth.users;`
    // Wait, does `DELETE FROM auth.users` cascade to `auth.identities`?
    // In Supabase, `auth.identities` has `ON DELETE CASCADE`. So deleting from `auth.users` SHOULD cascade.
}

run();
