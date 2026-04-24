-- High-Performance Batch Promotion Function
-- Optimized for speed, atomicity, and namespace safety

CREATE OR REPLACE FUNCTION public.batch_promote_students_v1(
    p_mappings JSONB,
    p_new_academic_year TEXT,
    p_promoted_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    mapping RECORD;
    v_total_promoted INT := 0;
    v_total_graduated INT := 0;
    v_total_repeated INT := 0;
    v_current_month TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    v_due_date DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '9 days')::DATE;
BEGIN
    -- 1. Create a temporary table for involved students
    CREATE TEMP TABLE promo_staging (
        student_id UUID,
        source_class_id UUID,
        target_class_id UUID,
        old_roll TEXT,
        new_roll TEXT,
        old_academic_year TEXT,
        target_status TEXT,
        target_fee NUMERIC,
        is_graduation BOOLEAN,
        is_repeat BOOLEAN
    ) ON COMMIT DROP;

    -- 2. Extract mappings and identify actions
    FOR mapping IN SELECT * FROM JSONB_ARRAY_ELEMENTS(p_mappings) LOOP
        INSERT INTO promo_staging (
            student_id,
            source_class_id,
            target_class_id,
            old_roll,
            new_roll,
            old_academic_year,
            target_status,
            target_fee,
            is_graduation,
            is_repeat
        )
        SELECT 
            s.id,
            s.class_id,
            CASE 
                WHEN (mapping.value->'excluded_student_ids')::JSONB @> JSONB_BUILD_ARRAY(s.id::TEXT) THEN (mapping.value->>'source_class_id')::UUID
                WHEN (mapping.value->>'destination_class_id') IS NULL OR (mapping.value->>'is_graduation')::BOOLEAN THEN NULL
                ELSE (mapping.value->>'destination_class_id')::UUID
            END as target_class_id,
            s.roll_number,
            -- Roll Number Calculation
            COALESCE(
                (mapping.value->'roll_number_overrides')->>(s.id::TEXT),
                CASE 
                    WHEN (mapping.value->'excluded_student_ids')::JSONB @> JSONB_BUILD_ARRAY(s.id::TEXT) THEN s.roll_number
                    WHEN (mapping.value->>'destination_class_id') IS NULL OR (mapping.value->>'is_graduation')::BOOLEAN THEN s.roll_number
                    ELSE (
                        SELECT 
                            'C' || (REGEXP_MATCHES(c.name, '\d+'))[1] || '-' || c.section || '-' || 
                            CASE 
                                WHEN s.roll_number LIKE '%-%' THEN 
                                    CASE 
                                        WHEN ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(s.roll_number, '-'), 1) >= 3 
                                        THEN (REGEXP_SPLIT_TO_ARRAY(s.roll_number, '-'))[ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(s.roll_number, '-'), 1)]
                                        ELSE s.roll_number 
                                    END
                                ELSE s.roll_number 
                            END
                        FROM public.classes c WHERE c.id = (mapping.value->>'destination_class_id')::UUID
                    )
                END
            ) as new_roll,
            s.academic_year,
            CASE 
                WHEN (mapping.value->'excluded_student_ids')::JSONB @> JSONB_BUILD_ARRAY(s.id::TEXT) THEN 'ACTIVE'
                WHEN (mapping.value->>'destination_class_id') IS NULL OR (mapping.value->>'is_graduation')::BOOLEAN THEN 'GRADUATED'
                ELSE 'ACTIVE'
            END as target_status,
            COALESCE(
                (mapping.value->>'target_monthly_fee')::NUMERIC,
                (SELECT monthly_fee FROM public.fee_structures WHERE class_id = (mapping.value->>'destination_class_id')::UUID),
                s.monthly_fee
            ) as target_fee,
            NOT ((mapping.value->'excluded_student_ids')::JSONB @> JSONB_BUILD_ARRAY(s.id::TEXT)) AND ((mapping.value->>'destination_class_id') IS NULL OR (mapping.value->>'is_graduation')::BOOLEAN) as is_graduation,
            (mapping.value->'excluded_student_ids')::JSONB @> JSONB_BUILD_ARRAY(s.id::TEXT) as is_repeat
        FROM public.students s
        WHERE s.class_id = (mapping.value->>'source_class_id')::UUID
        AND s.status = 'ACTIVE';
    END LOOP;

    -- 3. Pass 1: Clearance (Move to TMP roll numbers to avoid unique constraint collisions)
    UPDATE public.students s
    SET roll_number = 'TMP-' || LEFT(s.id::TEXT, 8) || '-' || s.roll_number
    FROM promo_staging p
    WHERE s.id = p.student_id;

    -- 4. Pass 2: Final State Update
    UPDATE public.students s
    SET 
        class_id = p.target_class_id,
        academic_year = p_new_academic_year,
        status = p.target_status,
        roll_number = p.new_roll,
        monthly_fee = p.target_fee
    FROM promo_staging p
    WHERE s.id = p.student_id;

    -- 5. Log Promotion History
    INSERT INTO public.promotion_history (
        student_id,
        from_class_id,
        to_class_id,
        from_academic_year,
        to_academic_year,
        is_graduation,
        promoted_by
    )
    SELECT 
        p.student_id,
        p.source_class_id,
        p.target_class_id,
        p.old_academic_year,
        p_new_academic_year,
        p.is_graduation,
        p_promoted_by
    FROM promo_staging p;

    -- 6. Generate Initial Fee Challans (for non-graduates)
    INSERT INTO public.fee_challans (
        student_id,
        fee_structure_id,
        month_year,
        amount_due,
        status,
        due_date
    )
    SELECT 
        p.student_id,
        fs.id,
        v_current_month,
        p.target_fee,
        'PENDING',
        v_due_date
    FROM promo_staging p
    JOIN public.fee_structures fs ON fs.class_id = p.target_class_id
    WHERE p.is_graduation = FALSE;

    -- Get final counts
    SELECT COUNT(*) FILTER (WHERE is_graduation) INTO v_total_graduated FROM promo_staging;
    SELECT COUNT(*) FILTER (WHERE is_repeat) INTO v_total_repeated FROM promo_staging;
    SELECT COUNT(*) FILTER (WHERE NOT is_graduation AND NOT is_repeat) INTO v_total_promoted FROM promo_staging;

    RETURN JSONB_BUILD_OBJECT(
        'success', TRUE,
        'total_promoted', v_total_promoted,
        'total_graduated', v_total_graduated,
        'total_repeated', v_total_repeated
    );

EXCEPTION WHEN OTHERS THEN
    RETURN JSONB_BUILD_OBJECT(
        'success', FALSE,
        'error', SQLERRM
    );
END;
$$;
