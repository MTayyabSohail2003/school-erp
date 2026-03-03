/**
 * Supabase Seed Script — School ERP
 * Inserts realistic dummy data across all tables:
 *   classes → students → (teacher_profiles) → exams → subjects → attendance → exam_marks
 *
 * Usage: node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Fatal: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n) => String(n).padStart(3, '0');

const FIRST_NAMES = [
    'Ali', 'Ahmed', 'Muhammad', 'Usman', 'Bilal', 'Hassan', 'Ibrahim', 'Omar',
    'Zaid', 'Yusuf', 'Fatima', 'Ayesha', 'Zara', 'Sana', 'Noor', 'Hina',
    'Amna', 'Sara', 'Mariam', 'Khadija', 'Talha', 'Hamza', 'Saad', 'Faisal',
    'Anas', 'Imran', 'Asad', 'Waqar', 'Taha', 'Junaid',
];

const LAST_NAMES = [
    'Khan', 'Ahmed', 'Ali', 'Sheikh', 'Malik', 'Butt', 'Awan', 'Siddiqui',
    'Hussain', 'Chaudhry', 'Raza', 'Iqbal', 'Mirza', 'Nawaz', 'Baig',
];

const QUALIFICATIONS = ['B.Ed', 'M.Ed', 'B.Sc Education', 'MA Education', 'M.Phil', 'PhD Education'];

const GRADE_THRESHOLDS = [
    { min: 85, grade: 'A' },
    { min: 70, grade: 'B' },
    { min: 55, grade: 'C' },
    { min: 40, grade: 'D' },
    { min: 0, grade: 'F' },
];

function calcGrade(obtained, total) {
    const pct = total > 0 ? (obtained / total) * 100 : 0;
    return GRADE_THRESHOLDS.find((t) => pct >= t.min)?.grade ?? 'F';
}

function randomName() {
    return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function randomDOB() {
    const year = randInt(2005, 2015);
    const month = String(randInt(1, 12)).padStart(2, '0');
    const day = String(randInt(1, 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function randomDate(startYear, endYear) {
    const year = randInt(startYear, endYear);
    const month = String(randInt(1, 12)).padStart(2, '0');
    const day = String(randInt(1, 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function log(msg) {
    console.log(`✔  ${msg}`);
}
function err(msg, e) {
    console.error(`✘  ${msg}`, e?.message ?? e);
}

// ─── Step 1: Classes ─────────────────────────────────────────────────────────

async function seedClasses() {
    const classData = [
        { name: 'Nursery', section: 'A' },
        { name: 'Nursery', section: 'B' },
        { name: 'Class 1', section: 'A' },
        { name: 'Class 1', section: 'B' },
        { name: 'Class 2', section: 'A' },
        { name: 'Class 3', section: 'A' },
        { name: 'Class 4', section: 'A' },
        { name: 'Class 5', section: 'A' },
        { name: 'Class 6', section: 'A' },
        { name: 'Class 7', section: 'A' },
        { name: 'Class 8', section: 'A' },
        { name: 'Class 9', section: 'A' },
        { name: 'Class 10', section: 'A' },
        { name: 'Class 10', section: 'B' },
    ];

    // Try to insert, ignore duplicates
    await supabase.from('classes').upsert(classData, { onConflict: 'name,section', ignoreDuplicates: true });

    // Always SELECT to get all rows (including pre-existing ones)
    const { data, error } = await supabase.from('classes').select('*');
    if (error) { err('Classes fetch', error); return []; }
    log(`Classes: ${data.length} total in DB`);
    return data;
}

// ─── Step 2: Staff (users + teacher_profiles) ────────────────────────────────
// Note: We use supabase.auth.admin.createUser to create real auth users.
// If the emails already exist we skip them gracefully.

async function seedStaff() {
    const staffList = Array.from({ length: 15 }, (_, i) => ({
        email: `teacher${i + 1}@schoolerp.test`,
        full_name: randomName(),
        phone_number: `03${randInt(10, 99)}${randInt(1000000, 9999999)}`,
        qualification: pick(QUALIFICATIONS),
        monthly_salary: randInt(25000, 80000),
    }));

    const results = [];

    for (const staff of staffList) {
        // Create the auth user
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email: staff.email,
            password: 'Teacher@1234',
            email_confirm: true,
            user_metadata: { full_name: staff.full_name },
        });

        if (authErr) {
            if (authErr.message.includes('already been registered')) {
                // User already exists — fetch from users table
                const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', staff.email)
                    .single();
                if (existing) results.push({ id: existing.id, ...staff });
            } else {
                err(`Auth user for ${staff.email}`, authErr);
            }
            continue;
        }

        const userId = authData.user.id;

        // Upsert into the users table
        await supabase.from('users').upsert({
            id: userId,
            email: staff.email,
            full_name: staff.full_name,
            phone_number: staff.phone_number,
            role: 'TEACHER',
        }, { onConflict: 'id', ignoreDuplicates: true });

        // Create teacher_profile
        await supabase.from('teacher_profiles').upsert({
            user_id: userId,
            qualification: staff.qualification,
            monthly_salary: staff.monthly_salary,
        }, { onConflict: 'user_id', ignoreDuplicates: true });

        results.push({ id: userId, ...staff });
    }

    log(`Staff: ${results.length} teachers processed`);
    return results;
}

// ─── Step 3: Students ─────────────────────────────────────────────────────────

async function seedStudents(classes) {
    const students = [];
    let rollCounter = 1;

    for (const cls of classes) {
        const count = randInt(8, 12);
        for (let i = 0; i < count; i++) {
            students.push({
                roll_number: `R${pad(rollCounter++)}`,
                full_name: randomName(),
                date_of_birth: randomDOB(),
                class_id: cls.id,
                b_form_url: null,
                old_cert_url: null,
            });
        }
    }

    // Insert only new students (roll_number is unique)
    await supabase.from('students').upsert(students, { onConflict: 'roll_number', ignoreDuplicates: true });

    // Always SELECT to get all (including pre-existing)
    const { data, error } = await supabase.from('students').select('id, class_id, full_name, roll_number');
    if (error) { err('Students fetch', error); return []; }
    log(`Students: ${data.length} total in DB`);
    return data;
}

// ─── Step 4: Exams ────────────────────────────────────────────────────────────

async function seedExams() {
    const exams = [
        { title: '1st Monthly Test 2026', start_date: '2026-01-15', end_date: '2026-01-19' },
        { title: '2nd Monthly Test 2026', start_date: '2026-02-10', end_date: '2026-02-14' },
        { title: 'Mid-Term Exam 2026', start_date: '2026-03-01', end_date: '2026-03-07' },
        { title: 'Final Term Exam 2026', start_date: '2026-05-15', end_date: '2026-05-25' },
    ];

    // Check existing to avoid duplicates
    const { data: existing } = await supabase.from('exams').select('*');
    const existingTitles = new Set((existing ?? []).map((e) => e.title));
    const toInsert = exams.filter((e) => !existingTitles.has(e.title));

    if (toInsert.length > 0) {
        const { error } = await supabase.from('exams').insert(toInsert);
        if (error) { err('Exams insert', error); }
    }

    const { data, error } = await supabase.from('exams').select('*');
    if (error) { err('Exams fetch', error); return []; }
    log(`Exams: ${data.length} total`);
    return data;
}

// ─── Step 5: Subjects (per class) ────────────────────────────────────────────

async function seedSubjects(classes) {
    const SUBJECTS = ['Mathematics', 'English', 'Urdu', 'Science', 'Social Studies', 'Islamiat', 'Computer'];

    // Fetch what already exists
    const { data: existing } = await supabase.from('subjects').select('name,class_id');
    const existingSet = new Set((existing ?? []).map((s) => `${s.name}::${s.class_id}`));

    const rows = [];
    for (const cls of classes) {
        for (const subName of SUBJECTS) {
            const key = `${subName}::${cls.id}`;
            if (!existingSet.has(key)) {
                rows.push({ name: subName, class_id: cls.id });
            }
        }
    }

    if (rows.length > 0) {
        const { error } = await supabase.from('subjects').insert(rows);
        if (error) { err('Subjects insert', error); }
    }

    const { data, error } = await supabase.from('subjects').select('*');
    if (error) { err('Subjects fetch', error); return []; }
    log(`Subjects: ${data.length} total`);
    return data;
}

// ─── Step 6: Attendance (last 30 days) ───────────────────────────────────────

async function seedAttendance(students) {
    const STATUSES = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LEAVE'];
    const rows = [];

    // Fetch a valid user ID to use as marked_by
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const markedById = users?.[0]?.id;
    if (!markedById) {
        err('Attendance', 'No users found to use as marked_by — skipping attendance seed.');
        return;
    }

    // Last 30 school days (skip weekends)
    const dates = [];
    const today = new Date();
    for (let d = 1; d <= 45 && dates.length < 30; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - d);
        const dow = date.getDay();
        if (dow !== 0 && dow !== 6) {
            dates.push(date.toISOString().split('T')[0]);
        }
    }

    for (const student of students) {
        for (const date of dates) {
            rows.push({
                student_id: student.id,
                record_date: date,
                status: pick(STATUSES),
                marked_by: markedById,
            });
        }
    }

    // Insert in batches of 500
    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { error } = await supabase
            .from('attendance')
            .upsert(batch, { onConflict: 'student_id,record_date', ignoreDuplicates: true });
        if (error) { err(`Attendance batch ${i / BATCH + 1}`, error); }
        else inserted += batch.length;
    }

    log(`Attendance: ${inserted} records inserted (${students.length} students × ${dates.length} days)`);
}


// ─── Step 7: Exam Marks ───────────────────────────────────────────────────────

async function seedMarks(exams, students, subjects) {
    const rows = [];

    for (const exam of exams) {
        for (const student of students) {
            // Find subjects for this student's class
            const classSubjects = subjects.filter((s) => s.class_id === student.class_id);
            for (const subject of classSubjects) {
                const total = 100;
                const obtained = randInt(30, 100);
                rows.push({
                    exam_id: exam.id,
                    student_id: student.id,
                    subject_id: subject.id,
                    marks_obtained: obtained,
                    total_marks: total,
                    grade: calcGrade(obtained, total),
                });
            }
        }
    }

    // Insert in batches
    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { error } = await supabase
            .from('exam_marks')
            .upsert(batch, { onConflict: 'exam_id,student_id,subject_id', ignoreDuplicates: true });
        if (error) { err(`Marks batch ${i / BATCH + 1}`, error); }
        else inserted += batch.length;
    }

    log(`Exam Marks: ${inserted} records inserted`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🌱  Starting School ERP Seed Script...\n');

    const classes = await seedClasses();
    const staff = await seedStaff();
    const students = await seedStudents(classes);
    const exams = await seedExams();
    const subjects = await seedSubjects(classes);

    await seedAttendance(students);
    await seedMarks(exams, students, subjects);

    console.log('\n✅  Seed complete!\n');
    console.log(`   Classes:    ${classes.length}`);
    console.log(`   Staff:      ${staff.length}`);
    console.log(`   Students:   ${students.length}`);
    console.log(`   Exams:      ${exams.length}`);
    console.log(`   Subjects:   ${subjects.length}`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
