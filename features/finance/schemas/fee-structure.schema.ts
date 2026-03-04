import { z } from 'zod';

export const feeStructureSchema = z.object({
    id: z.string().uuid().optional(),
    class_id: z.string().uuid({ message: "Class is required" }),
    monthly_fee: z.number().min(0, "Fee must be a positive number"),
});

export type FeeStructureFormValues = z.infer<typeof feeStructureSchema>;

export type FeeStructure = FeeStructureFormValues & {
    id: string;
    created_at: string;
    classes: {
        name: string;
        section: string;
    };
};
