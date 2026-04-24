-- High-Performance Bulk Fee Generation Function
-- Automatically calculates arrears and prevents duplicates

CREATE OR REPLACE FUNCTION public.generate_monthly_challans_v1(
    p_month_year TEXT -- Format: 'YYYY-MM'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT := 0;
    v_due_date DATE;
BEGIN
    -- 1. Set Due Date to 10th of the target month
    v_due_date := (p_month_year || '-10')::DATE;

    -- 2. Bulk Insert into fee_challans
    INSERT INTO public.fee_challans (
        student_id,
        fee_structure_id,
        month_year,
        arrears,
        amount_due,
        status,
        due_date
    )
    SELECT 
        s.id as student_id,
        fs.id as fee_structure_id,
        p_month_year,
        COALESCE(arrears_query.total_arrears, 0) as arrears,
        -- Total Due = Student Base Fee (or Class Fee) + Arrears
        (COALESCE(s.monthly_fee, fs.monthly_fee) + COALESCE(arrears_query.total_arrears, 0)) as amount_due,
        'PENDING',
        v_due_date
    FROM public.students s
    -- Link to Fee Structure for the class
    JOIN public.fee_structures fs ON fs.class_id = s.class_id
    -- Outstanding Arrears subquery
    LEFT JOIN (
        SELECT 
            student_id,
            SUM(amount_due + COALESCE(fines, 0) - paid_amount - COALESCE(discount, 0)) as total_arrears
        FROM public.fee_challans
        WHERE status IN ('PENDING', 'OVERDUE', 'PARTIAL')
        AND month_year < p_month_year
        GROUP BY student_id
    ) arrears_query ON arrears_query.student_id = s.id
    -- Filter out students who already have a challan for this month
    WHERE s.id NOT IN (
        SELECT student_id 
        FROM public.fee_challans 
        WHERE month_year = p_month_year
    )
    AND s.status = 'ACTIVE';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN JSONB_BUILD_OBJECT(
        'success', TRUE,
        'count', v_count,
        'message', 'Successfully generated ' || v_count || ' challans for ' || p_month_year
    );

EXCEPTION WHEN OTHERS THEN
    RETURN JSONB_BUILD_OBJECT(
        'success', FALSE,
        'error', SQLERRM
    );
END;
$$;
