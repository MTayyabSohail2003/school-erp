'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AuthListener() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // When a token is refreshed, the supabase-js client updates 
                // the session in memory. We call router.refresh() to ensure
                // that Server Components are aware of the new session data 
                // stored in the cookies.
                router.refresh();
            }
            
            if (event === 'SIGNED_OUT') {
                // Force a refresh to clear any server-side state
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    // This component doesn't render anything
    return null;
}
