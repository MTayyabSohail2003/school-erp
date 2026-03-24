// ============================================================
// TIMETABLE SEED SCRIPT
// Seeds subjects_master, assigns them to classes 8/9/10,
// and builds a full Mon-Sat period schedule for each class
// using the first 2 existing staff members.
//
// Run: node scripts/seed-timetable.mjs
// ============================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ── Config ───────────────────────────────────────────────────
const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACADEMIC_YEAR       = '2026-2027';
const TARGET_CLASS_NAMES  = ['8', '9', '10']; // matches classes whose name includes these

const SUBJECTS = [
    { name: 'Mathematics',        code: 'MATH'  },
    { name: 'English',            code: 'ENG'   },
    { name: 'Urdu',               code: 'URD'   },
    { name: 'Physics',            code: 'PHY'   },
    { name: 'Chemistry',          code: 'CHEM'  },
    { name: 'Biology',            code: 'BIO'   },
    { name: 'Computer Science',   code: 'CS'    },
    { name: 'Islamiat',           code: 'ISL'   },
    { name: 'Pakistan Studies',   code: 'PKST'  },
];

const DAYS = [
    { id: 1, name: 'Monday'    },
    { id: 2, name: 'Tuesday'   },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday'  },
    { id: 5, name: 'Friday'    },
    { id: 6, name: 'Saturday'  },
];
// ─────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

function log(msg) { console.log(`[SEED] ${msg}`); }
function err(msg) { console.error(`[ERROR] ${msg}`); }

// ── STEP 1: Fetch first 2 staff members ──────────────────────
async function fetchTeachers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'TEACHER')
        .limit(2);

    if (error) throw new Error(`Fetching teachers: ${error.message}`);
    if (!data || data.length < 1) throw new Error('No teachers found in users table. Add staff first.');

    log(`Found ${data.length} teacher(s): ${data.map(t => t.full_name).join(', ')}`);
    return data;
}

// ── STEP 2: Fetch target classes (8, 9, 10) ──────────────────
async function fetchTargetClasses() {
    const { data, error } = await supabase
        .from('classes')
        .select('id, name, section');

    if (error) throw new Error(`Fetching classes: ${error.message}`);

    const filtered = (data || []).filter(c =>
        TARGET_CLASS_NAMES.some(n => {
            const regex = new RegExp(`(^|\\s|-)${n}(\\s|-|$)`, 'i');
            return regex.test(c.name);
        })
    );

    if (filtered.length === 0) throw new Error('No classes found matching names: ' + TARGET_CLASS_NAMES.join(', '));
    log(`Found ${filtered.length} class(es): ${filtered.map(c => `${c.name}-${c.section}`).join(', ')}`);
    return filtered;
}

// ── STEP 3: Fetch existing periods ───────────────────────────
async function fetchPeriods() {
    const { data, error } = await supabase
        .from('periods')
        .select('id, name, order_index')
        .order('order_index', { ascending: true });

    if (error) throw new Error(`Fetching periods: ${error.message}`);
    if (!data || data.length === 0) throw new Error('No periods found. Define periods in Academics Setup first.');

    // Exclude breaks (is_break column may exist)
    const teachingPeriods = data.filter(p => !p.is_break);
    log(`Found ${teachingPeriods.length} teaching period(s).`);
    return teachingPeriods;
}

// ── STEP 4: Upsert subjects into subjects_master ─────────────
async function upsertMasterSubjects() {
    // Check existing first to avoid code conflicts
    const { data: existing } = await supabase
        .from('subjects_master')
        .select('id, name, code');

    const existingCodes = new Set((existing || []).map(s => s.code));
    const toInsert = SUBJECTS.filter(s => !existingCodes.has(s.code));

    let allMasters = existing || [];

    if (toInsert.length > 0) {
        const { data, error } = await supabase
            .from('subjects_master')
            .insert(toInsert)
            .select('id, name, code');

        if (error) throw new Error(`Inserting subjects_master: ${error.message}`);
        allMasters = [...allMasters, ...(data || [])];
        log(`Created ${toInsert.length} new subject(s) in master pool.`);
    } else {
        log('All subjects already exist in master pool. Skipping insert.');
    }

    // Return only the subjects we care about (filtered by our SUBJECTS list)
    const codes = new Set(SUBJECTS.map(s => s.code));
    return allMasters.filter(s => codes.has(s.code));
}

// ── STEP 5: Assign subjects to each class ────────────────────
async function assignSubjectsToClasses(classes, masterSubjects) {
    for (const cls of classes) {
        // Get already-assigned subjects for this class
        const { data: existing } = await supabase
            .from('subjects')
            .select('master_id')
            .eq('class_id', cls.id);

        const existingMasterIds = new Set((existing || []).map(s => s.master_id));
        const toAssign = masterSubjects.filter(m => !existingMasterIds.has(m.id));

        if (toAssign.length === 0) {
            log(`Class ${cls.name}-${cls.section}: All subjects already assigned, skipping.`);
            continue;
        }

        const assignments = toAssign.map(m => ({
            class_id:  cls.id,
            master_id: m.id,
            name:      m.name,
            code:      m.code,
        }));

        const { error } = await supabase.from('subjects').insert(assignments);
        if (error) throw new Error(`Assigning subjects to ${cls.name}: ${error.message}`);
        log(`Class ${cls.name}-${cls.section}: Assigned ${toAssign.length} subject(s).`);
    }
}

// ── STEP 6: Build timetable ───────────────────────────────────
async function buildTimetable(classes, masterSubjects, teachers, periods) {
    const entries = [];
    const teacherCount = teachers.length; // 1 or 2

    for (const cls of classes) {
        // Fetch class-specific subject assignments to get their IDs
        const { data: classSubjects, error } = await supabase
            .from('subjects')
            .select('id, name, master_id')
            .eq('class_id', cls.id);

        if (error) throw new Error(`Fetching class subjects for ${cls.name}: ${error.message}`);

        // Check existing timetable entries to avoid duplicates
        const { data: existingEntries } = await supabase
            .from('timetable')
            .select('period_id, day_of_week')
            .eq('class_id', cls.id)
            .eq('academic_year', ACADEMIC_YEAR);

        const existingKeys = new Set(
            (existingEntries || []).map(e => `${e.day_of_week}-${e.period_id}`)
        );

        let subjectIndex = 0;
        let teacherIndex = 0;

        for (const day of DAYS) {
            for (const period of periods) {
                const key = `${day.id}-${period.id}`;
                if (existingKeys.has(key)) continue; // skip already assigned

                const subject = classSubjects[subjectIndex % classSubjects.length];
                const teacher = teachers[teacherIndex % teacherCount];

                entries.push({
                    class_id:     cls.id,
                    period_id:    period.id,
                    day_of_week:  day.id,
                    teacher_id:   teacher.id,
                    subject_id:   subject.id,
                    academic_year: ACADEMIC_YEAR,
                });

                subjectIndex++;
                // Alternate teacher every period for even distribution
                teacherIndex++;
            }
        }

        log(`Class ${cls.name}-${cls.section}: Queued ${entries.filter(e => e.class_id === cls.id).length} timetable slot(s).`);
    }

    if (entries.length === 0) {
        log('All timetable slots already exist. Nothing to insert.');
        return;
    }

    // Batch upsert to avoid conflicts
    const BATCH = 50;
    for (let i = 0; i < entries.length; i += BATCH) {
        const batch = entries.slice(i, i + BATCH);
        const { error } = await supabase.from('timetable').upsert(batch, {
            onConflict: 'class_id,period_id,day_of_week,academic_year'
        });
        if (error) {
            // Try plain insert as fallback if upsert fails (no unique constraint)
            const { error: insertErr } = await supabase.from('timetable').insert(batch);
            if (insertErr) throw new Error(`Inserting timetable batch: ${insertErr.message}`);
        }
    }

    log(`Inserted ${entries.length} timetable entries successfully.`);
}

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
    console.log('\n🚀 Starting Timetable Seed Script...\n');

    try {
        const [teachers, classes, periods] = await Promise.all([
            fetchTeachers(),
            fetchTargetClasses(),
            fetchPeriods(),
        ]);

        const masterSubjects = await upsertMasterSubjects();
        await assignSubjectsToClasses(classes, masterSubjects);
        await buildTimetable(classes, masterSubjects, teachers, periods);

        console.log('\n✅ Seed complete! Classes 8, 9, 10 now have subjects and a full timetable.\n');
    } catch (e) {
        err(e.message);
        process.exit(1);
    }
}

main();
