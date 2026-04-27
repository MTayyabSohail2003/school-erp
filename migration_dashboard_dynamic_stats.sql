-- SQL Patch: Dashboard Dynamic Hardening (V2)
-- Updates RPCs with correct table names and ensuring dynamic data accuracy.

-- 1. Update Chart Stats RPC
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
                    COALESCE(SUM(amount_due + arrears + COALESCE(fines, 0) - paid_amount - COALESCE(discount, 0)) FILTER (WHERE status != 'PAID'), 0) as pending
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

        -- 3. Class Strength (Dynamic Students count)
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
                ORDER BY c.name ASC
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

        -- 5. Subject Performance (Updated to use NEW exam_results table)
        'subjectPerformance', (
            SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
                'subject', subject_name,
                'average', ROUND(avg_pct),
                'highest', ROUND(max_pct)
            ))
            FROM (
                SELECT 
                    sub.name as subject_name,
                    AVG((obtained_marks / total_marks) * 100) as avg_pct,
                    MAX((obtained_marks / total_marks) * 100) as max_pct
                FROM public.exam_results r
                JOIN public.subjects sub ON sub.id = r.subject_id
                WHERE r.total_marks > 0
                GROUP BY sub.id, sub.name
                ORDER BY avg_pct DESC
                LIMIT 8
            ) sub2
        )
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;

-- 2. Update Dashboard Stats RPC (Profitability & Promotion Awareness)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats_v1()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_today_iso TEXT := CURRENT_DATE::TEXT;
    v_current_month TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    v_stats JSONB;
BEGIN
    SELECT JSONB_BUILD_OBJECT(
        -- Total Active Students
        'studentCount', (SELECT COUNT(*) FROM public.students WHERE status = 'ACTIVE'),
        -- Total Teachers
        'teacherCount', (SELECT COUNT(*) FROM public.users WHERE role = 'TEACHER'),
        
        -- Financial Statistics
        'financials', (
            SELECT JSONB_BUILD_OBJECT(
                -- Current Month Performance
                'currentMonthCollected', COALESCE(SUM(paid_amount) FILTER (WHERE status = 'PAID'), 0),
                'currentMonthPending', COALESCE(SUM(amount_due + arrears + COALESCE(fines, 0) - paid_amount - COALESCE(discount, 0)) FILTER (WHERE status != 'PAID'), 0),
                'currentMonthPaidCount', COUNT(*) FILTER (WHERE status = 'PAID'),
                'currentMonthPendingCount', COUNT(*) FILTER (WHERE status != 'PAID'),
                
                -- Monthly Staff Cost
                'currentMonthStaffPayroll', (
                    SELECT COALESCE(SUM(net_paid), 0) 
                    FROM public.staff_payroll_ledger 
                    WHERE month_year = v_current_month
                ),
                
                -- Profitability (Revenue - Payroll)
                'currentMonthProfit', (
                    COALESCE(SUM(paid_amount) FILTER (WHERE status = 'PAID'), 0) - 
                    (SELECT COALESCE(SUM(net_paid), 0) FROM public.staff_payroll_ledger WHERE month_year = v_current_month)
                ),

                -- Arrears & Defaulters (All Time)
                'totalArrears', (
                    SELECT COALESCE(SUM(amount_due + arrears + COALESCE(fines, 0) - paid_amount - COALESCE(discount, 0)), 0) 
                    FROM public.fee_challans 
                    WHERE (status != 'PAID') 
                    AND (month_year < v_current_month OR (month_year = v_current_month AND due_date < v_today))
                ),
                'totalDefaultersCount', (
                    SELECT COUNT(DISTINCT student_id) 
                    FROM public.fee_challans 
                    WHERE (status != 'PAID') 
                    AND (month_year < v_current_month OR (month_year = v_current_month AND due_date < v_today))
                )
            )
            FROM public.fee_challans 
            WHERE month_year = v_current_month
        ),

        -- Attendance Statistics (Today)
        'attendance', (
            SELECT JSONB_BUILD_OBJECT(
                'date', v_today_iso,
                'present', COUNT(*) FILTER (WHERE status = 'PRESENT'),
                'absent', COUNT(*) FILTER (WHERE status = 'ABSENT'),
                'onLeave', COUNT(*) FILTER (WHERE status = 'LEAVE'),
                'totalMarked', COUNT(*),
                'rate', CASE 
                    WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'PRESENT')::NUMERIC / COUNT(*)::NUMERIC) * 100)
                    ELSE 0
                END
            )
            FROM public.attendance
            WHERE record_date = v_today
        )
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;
