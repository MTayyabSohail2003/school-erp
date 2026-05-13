/**
 * delete-all-auth-users.mjs
 * Deletes ALL Supabase Auth users using the Admin API (Service Role key).
 * 
 * Run with: node scripts/delete-all-auth-users.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────
// Get these from: Supabase Dashboard → Settings → API
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgkqpoqsxvbehcvexkmp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // set via env var

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    console.error('   Ensure it is set in your .env file or environment.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ── Main ──────────────────────────────────────────────────────────────────────
async function deleteAllAuthUsers() {
    console.log('🔍 Fetching all auth users...\n');

    let page = 1;
    let allUsers = [];

    // Paginate through all users (Supabase returns max 1000 per page)
    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({
            page,
            perPage: 1000,
        });

        if (error) {
            console.error('❌ Failed to fetch users:', error.message);
            process.exit(1);
        }

        if (!data.users.length) break;

        allUsers = allUsers.concat(data.users);
        if (data.users.length < 1000) break;
        page++;
    }

    if (!allUsers.length) {
        console.log('✅ No auth users found. Already clean.');
        return;
    }

    console.log(`Found ${allUsers.length} user(s). Deleting...\n`);

    let deleted = 0;
    let failed = 0;

    for (const user of allUsers) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
            console.error(`  ❌ Failed to delete ${user.email}: ${error.message}`);
            failed++;
        } else {
            console.log(`  ✓ Deleted: ${user.email} (${user.id})`);
            deleted++;
        }
    }

    console.log('\n────────────────────────────────');
    console.log(`✅ Done. Deleted: ${deleted} | Failed: ${failed}`);
    console.log('────────────────────────────────');
    console.log('\nNext: Create a new admin user in Supabase → Authentication → Add User');
    console.log('Then run the INSERT into public.users to register the profile.\n');
}

deleteAllAuthUsers();
