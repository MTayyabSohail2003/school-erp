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

async function seedData() {
    console.log('Starting data seed...');

    const classesToCreate = [
        { name: 'Class 8', section: 'A' },
        { name: 'Class 9', section: 'A' },
        { name: 'Class 10', section: 'A' }
    ];

    for (const cls of classesToCreate) {
        console.log(`Checking/Creating ${cls.name} Section ${cls.section}...`);

        let { data: existingClass, error: findClassErr } = await supabase
            .from('classes')
            .select('id')
            .eq('name', cls.name)
            .eq('section', cls.section)
            .single();

        let classId;

        if (existingClass) {
            console.log(`Class already exists. ID: ${existingClass.id}`);
            classId = existingClass.id;
        } else {
            const { data: newClass, error: insertClassErr } = await supabase
                .from('classes')
                .insert([{ name: cls.name, section: cls.section }])
                .select('id')
                .single();

            if (insertClassErr) {
                console.error(`Failed to insert class ${cls.name}:`, insertClassErr.message);
                continue;
            }
            classId = newClass.id;
            console.log(`Created new class. ID: ${classId}`);
        }

        console.log(`Adding 5 students to ${cls.name}...`);
        for (let i = 1; i <= 5; i++) {
            const rollNumber = `${cls.name.replace('Class ', 'C')}-${cls.section}-${i.toString().padStart(3, '0')}`;
            const studentName = `Test Student ${i} (${cls.name})`;

            // Check if student exists
            const { data: existingStudent } = await supabase
                .from('students')
                .select('id')
                .eq('roll_number', rollNumber)
                .single();

            if (existingStudent) {
                console.log(`  Student ${rollNumber} already exists.`);
                continue;
            }

            const { error: insertStudentErr } = await supabase
                .from('students')
                .insert([{
                    roll_number: rollNumber,
                    full_name: studentName,
                    date_of_birth: '2010-01-01', // Example date
                    class_id: classId
                }]);

            if (insertStudentErr) {
                console.error(`  Failed to insert student ${studentName}:`, insertStudentErr.message);
            } else {
                console.log(`  Inserted ${studentName} (${rollNumber})`);
            }
        }
    }

    console.log('Data seed complete!');
}

seedData();
