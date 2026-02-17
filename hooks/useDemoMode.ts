import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface DemoModeState {
    isDemoMode: boolean;
    isEngineerViewOpen: boolean;
    toggleEngineerView: () => void;
}

/**
 * Demo mode is determined by the profile's `is_demo` flag,
 * set during anonymous authentication.
 * No more URL params or mock data — demo users are real Supabase users.
 */
export const useDemoMode = (): DemoModeState => {
    const { profile } = useAuth();

    console.log('[useDemoMode] Profile:', profile);
    console.log('[useDemoMode] is_demo:', profile?.is_demo);

    const isDemoMode = profile?.is_demo === true;

    // Engineer view / Glass Box can be toggled by demo users
    const [isEngineerViewOpen, setIsEngineerViewOpen] = useState(false);

    const toggleEngineerView = () => {
        setIsEngineerViewOpen(prev => !prev);
    };

    return {
        isDemoMode,
        isEngineerViewOpen,
        toggleEngineerView
    };
};
