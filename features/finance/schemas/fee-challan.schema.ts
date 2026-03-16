import { z } from 'zod';

export const challanStatusEnum = z.enum(['PENDING', 'PAID', 'OVERDUE']);
export type ChallanStatus = z.infer<typeof challanStatusEnum>;

export const feeChallanSchema = z.object({
    id: z.string().uuid().optional(),
    student_id: z.string().uuid(),
    fee_structure_id: z.string().uuid(),
    month_year: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
    amount_due: z.number().min(0),
    arrears: z.number().min(0).default(0),
    status: challanStatusEnum.default('PENDING'),
    due_date: z.string(),
    paid_date: z.string().nullable().optional(),
    payment_method: z.enum(['CASH', 'BANK']).nullable().optional(),
});

export type FeeChallan = z.infer<typeof feeChallanSchema> & {
    created_at: string;
    students?: {
        full_name: string;
        roll_number: string;
        classes: {
            name: string;
            section: string;
        };
    };
};
