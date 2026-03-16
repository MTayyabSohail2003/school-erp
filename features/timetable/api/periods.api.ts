import { createClient } from '@/lib/supabase/client';

export type Period = {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    order_index: number;
};

export const periodsApi = {
    getPeriods: async (): Promise<Period[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('periods')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw new Error(error.message);
        return data as Period[];
    },

    createPeriod: async (period: Omit<Period, 'id'>): Promise<Period> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('periods')
            .insert(period)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Period;
    },

    deletePeriod: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase
            .from('periods')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    bulkCreatePeriods: async (periods: Omit<Period, 'id'>[]): Promise<Period[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('periods')
            .insert(periods)
            .select();

        if (error) throw new Error(error.message);
        return data as Period[];
    }
};
