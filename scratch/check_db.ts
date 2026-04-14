import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTable() {
  const { data, error } = await supabase
    .from('staff_attendance')
    .select('count', { count: 'exact', head: true });
  
  if (error) {
    console.log('Error checking staff_attendance:', error.message);
  } else {
    console.log('staff_attendance exists. Row count:', data);
  }
}

checkTable();
