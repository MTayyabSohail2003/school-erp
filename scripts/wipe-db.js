import { createClient } from '@supabase/supabase-js';
import process from 'process';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase URL or service role key in env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function wipeDatabase() {
    console.log('Starting full database wipe for testing...');

    // 1. Delete all students from the 'students' table directly.
    console.log('Deleting all students...');
    const { data: students, error: studentFetchErr } = await supabase.from('students').select('id');
    if (studentFetchErr) {
        console.error('Error fetching students:', studentFetchErr.message);
    } else if (students && students.length > 0) {
        // Delete all students
        for (const s of students) {
            await supabase.from('students').delete().eq('id', s.id);
        }
        console.log(`Deleted ${students.length} students.`);
    } else {
        console.log('No students found to delete.');
    }

    // 2. Fetch users to delete from auth
    console.log('Fetching users (PARENT, TEACHER, STUDENT) to delete...');
    const { data: users, error: userFetchErr } = await supabase
        .from('users')
        .select('id, role, full_name')
        .in('role', ['STUDENT', 'PARENT', 'TEACHER']);

    if (userFetchErr) {
        console.error('Error fetching users:', userFetchErr.message);
    } else if (users && users.length > 0) {
        console.log(`Found ${users.length} users to delete.`);
        for (const user of users) {
            console.log(`Deleting Auth User: ${user.full_name} (${user.role})...`);
            const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
            if (authErr) {
                console.error(`Failed to delete Auth User ${user.id}:`, authErr.message);
                console.log(`Attempting to delete from public.users as fallback...`);
                await supabase.from('users').delete().eq('id', user.id);
            } else {
                console.log(`Successfully deleted auth user ${user.id}`);
            }
        }           
    } else {
        console.log('No teachers or parents found to delete.');
    }

    console.log('Database wipe complete. You can now test the project from scratch.');
}

wipeDatabase();
