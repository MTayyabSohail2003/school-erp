/**
 * create-admin-user.mjs
 * Creates a new ADMIN user in Supabase Auth + public.users profile + public.admin_profiles.
 *
 * Run with: node scripts/create-admin-user.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkqpoqsxvbehcvexkmp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── New Admin Details ─────────────────────────────────────────────────────────
const ADMIN_EMAIL     = 'muhammadtayyabsohail80@gmail.com';
const ADMIN_PASSWORD  = 'Tayyab@123';
const ADMIN_FULL_NAME = 'Muhammad Tayyab Sohail';

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    console.error('   Ensure it is set in your .env file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdmin() {
    console.log(`\n🔐 Creating Supabase Auth user: ${ADMIN_EMAIL}...\n`);

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // skip email verification
        user_metadata: { full_name: ADMIN_FULL_NAME }
    });

    if (authError) {
        console.error('❌ Auth user creation failed:', authError.message);
        process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created. ID: ${userId}`);

    // 2. Insert the public.users profile row
    console.log('\n📋 Inserting profile into public.users...\n');

    const { error: profileError } = await supabase
        .from('users')
        .insert({
            id:           userId,
            email:        ADMIN_EMAIL,
            role:         'ADMIN',
            full_name:    ADMIN_FULL_NAME,
        });

    if (profileError) {
        console.error('❌ Profile insert failed:', profileError.message);
        process.exit(1);
    }

    // 3. Insert into public.admin_profiles
    console.log('📋 Inserting into public.admin_profiles...\n');
    const { error: adminProfileError } = await supabase
        .from('admin_profiles')
        .insert({
            user_id: userId,
            department: 'Management'
        });

    if (adminProfileError) {
        console.error('❌ Admin profile insert failed:', adminProfileError.message);
        process.exit(1);
    }

    console.log('✅ Admin setup complete!');
    console.log('\n────────────────────────────────────────────');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Role     : ADMIN`);
    console.log(`   User ID  : ${userId}`);
    console.log('────────────────────────────────────────────');
    console.log('\n✅ You can now log in at your application.\n');
}

createAdmin();
