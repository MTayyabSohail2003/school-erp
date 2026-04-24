-- High-Performance Chart Data Aggregator
-- Native SQL aggregation for Revenue, Attendance, Strength, and Performance

CREATE OR REPLACE FUNCTION public.get_admin_chart_stats_v1()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSONB;
    v_today DATE := CURRENT_DATE;
    v_start_revenue_month TEXT := TO_CHAR(v_today - INTERVAL '5 months', 'YYYY-MM');
    v_current_month TEXT := TO_CHAR(v_today, 'YYYY-MM');
BEGIN
    SELECT JSONB_BUILD_OBJECT(
        -- 1. Monthly Revenue Trend (Last 6 Months)
        'monthlyRevenue', (
            SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
                'month', month_display,
                'collected', ROUND(collected::NUMERIC)::INT,
                'pending', ROUND(pending::NUMERIC)::INT
            ))
            FROM (
                SELECT 
                    month_year,
                    TO_CHAR(TO_DATE(month_year || '-01', 'YYYY-MM-DD'), 'Mon YY') as month_display,
                    COALESCE(SUM(paid_amount) FILTER (WHERE status = 'PAID'), 0) as collected,
                    COALESCE(SUM(amount_due - paid_amount) FILTER (WHERE status != 'PAID'), 0) as pending
                FROM public.fee_challans
                WHERE month_year >= v_start_revenue_month
                GROUP BY month_year
                ORDER BY month_year ASC
            ) sub
        ),

        -- 2. Attendance Trend (Last 7 Days)
        'attendanceTrend', (
            SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
                'date', TO_CHAR(d.day, 'Dy DD Mon'),
                'present', COALESCE(counts.present, 0),
                'absent', COALESCE(counts.absent, 0),
                'leave', COALESCE(counts.leave, 0)
            ))
            FROM (
                SELECT generate_series(v_today - INTERVAL '6 days', v_today, '1 day')::DATE as day
            ) d
            LEFT JOIN (
                SELECT 
                    record_date,
                    COUNT(*) FILTER (WHERE status = 'PRESENT') as present,
                    COUNT(*) FILTER (WHERE status = 'ABSENT') as absent,
                    COUNT(*) FILTER (WHERE status = 'LEAVE') as leave
                FROM public.attendance
                WHERE record_date >= v_today - INTERVAL '6 days'
                GROUP BY record_date
            ) counts ON counts.record_date = d.day
        ),

        -- 3. Class Strength (Top 10)
        'classStrength', (
            SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
                'class', class_display,
                'students', student_count
            ))
            FROM (
                SELECT 
                    c.name || ' ' || c.section as class_display,
                    COUNT(s.id) as student_count
                FROM public.classes c
                LEFT JOIN public.students s ON s.class_id = c.id AND s.status = 'ACTIVE'
                GROUP BY c.id, c.name, c.section
                HAVING COUNT(s.id) > 0
                ORDER BY student_count DESC
                LIMIT 10
            ) sub
        ),

        -- 4. Fee Status Breakdown (Current Month)
        'feeStatusBreakdown', (
            SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
                'name', name,
                'value', val,
                'color', color
            ))
            FROM (
                SELECT 'Paid' as name, COUNT(*) as val, '#10b981' as color FROM public.fee_challans WHERE month_year = v_current_month AND status = 'PAID'
                UNION ALL
                SELECT 'Pending' as name, COUNT(*) as val, '#f59e0b' as color FROM public.fee_challans WHERE month_year = v_current_month AND status = 'PENDING'
                UNION ALL
                SELECT 'Overdue' as name, COUNT(*) as val, '#ef4444' as color FROM public.fee_challans WHERE month_year = v_current_month AND status = 'OVERDUE'
            ) sub
            WHERE val > 0
        ),

        -- 5. Subject Performance (Top 8 based on Average Marks Percentage)
        'subjectPerformance', (
            SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
                'subject', subject_name,
                'average', ROUND(avg_pct),
                'highest', ROUND(max_pct)
            ))
            FROM (
                SELECT 
                    sub.name as subject_name,
                    AVG((m.marks_obtained / m.total_marks) * 100) as avg_pct,
                    MAX((m.marks_obtained / m.total_marks) * 100) as max_pct
                FROM public.exam_marks m
                JOIN public.subjects sub ON sub.id = m.subject_id
                WHERE m.total_marks > 0
                GROUP BY sub.id, sub.name
                ORDER BY avg_pct DESC
                LIMIT 8
            ) sub2
        )
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;
