-- Performance Tuning & Dashboard Optimization
-- This script adds critical indexes and a consolidated dashboard RPC

-- 1. DATABASE INDEXES (B-Tree)
-- Optimized for lists, filters, and dashboard calculations
CREATE INDEX IF NOT EXISTS idx_students_status_class ON public.students(status, class_id);
CREATE INDEX IF NOT EXISTS idx_fee_challans_month_status ON public.fee_challans(month_year, status);
CREATE INDEX IF NOT EXISTS idx_fee_challans_student_id ON public.fee_challans(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON public.attendance(record_date, status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_month ON public.staff_payroll_ledger(month_year);

-- 2. DASHBOARD AGGREGATOR RPC
-- Consolidates multiple queries into 1 native database operation
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
                'currentMonthPending', COALESCE(SUM(amount_due - paid_amount) FILTER (WHERE status != 'PAID'), 0),
                'currentMonthPaidCount', COUNT(*) FILTER (WHERE status = 'PAID'),
                'currentMonthPendingCount', COUNT(*) FILTER (WHERE status != 'PAID'),
                
                -- Monthly Staff Cost
                'currentMonthStaffPayroll', (
                    SELECT COALESCE(SUM(net_paid), 0) 
                    FROM public.staff_payroll_ledger 
                    WHERE month_year = v_current_month
                ),
                
                -- Profitability
                'currentMonthProfit', (
                    COALESCE(SUM(paid_amount) FILTER (WHERE status = 'PAID'), 0) - 
                    (SELECT COALESCE(SUM(net_paid), 0) FROM public.staff_payroll_ledger WHERE month_year = v_current_month)
                ),

                -- Arrears & Defaulters (All Time)
                'totalArrears', (
                    SELECT COALESCE(SUM(amount_due + COALESCE(fines, 0) - paid_amount - COALESCE(discount, 0)), 0) 
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
