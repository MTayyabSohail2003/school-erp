const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/mnt/Data/school/.env' });

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
    let query = supabaseAdmin
        .from('fee_challans')
        .select(`
            id,
            amount_due,
            month_year,
            status,
            student_id,
            student:students!inner (
                id,
                full_name,
                parent_id,
                parent:users!inner (
                    id,
                    full_name,
                    email
                )
            )
        `)
        .in('status', ['PENDING', 'OVERDUE']);

    const { data, error } = await query;
    if (error) {
        console.error("Query 1 Error:", error);
    } else {
        console.log("Query 1 Data length:", data?.length);
        if (data && data.length > 0) {
            console.log("Sample Data:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("No data returned by Query 1");
        }
    }

    // fallback query to check raw challans
    const { data: raw, error: err2 } = await supabaseAdmin.from('fee_challans').select('*');
    if (err2) {
        console.error("Query 2 Error:", err2);
    } else {
        console.log("Total fee_challans:", raw?.length);
        if (raw && raw.length > 0) {
             console.log("Sample raw challan:", raw[0]);
             const pending = raw.filter(r => r.status === 'PENDING' || r.status === 'OVERDUE');
             console.log("Pending raw challans:", pending.length);
        }
    }
}

run();
