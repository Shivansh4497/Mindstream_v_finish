import { useState, useEffect, useCallback } from 'react';
import type { View } from '../components/NavBar';

interface FTUEState {
    isActive: boolean;
    currentStep: number;
}

interface UseFTUEReturn {
    isActive: boolean;
    currentStep: number;
    startTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    completeTour: () => void;
}

const FTUE_STORAGE_KEY = 'mindstream_ftue_completed';

export const useFTUE = (
    shouldShowTour: boolean = false,
    onComplete?: () => Promise<void>
): UseFTUEReturn => {
    const [state, setState] = useState<FTUEState>({
        isActive: false,
        currentStep: 1
    });

    // Check if tour should start
    useEffect(() => {
        if (shouldShowTour) {
            // Small delay to let the app render first
            const timer = setTimeout(() => {
                setState({ isActive: true, currentStep: 1 });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [shouldShowTour]);

    const startTour = useCallback(() => {
        setState({ isActive: true, currentStep: 1 });
    }, []);

    const nextStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.min(prev.currentStep + 1, 4)
        }));
    }, []);

    const prevStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.max(prev.currentStep - 1, 1)
        }));
    }, []);

    const finishTour = useCallback(async () => {
        setState({ isActive: false, currentStep: 1 });
        localStorage.setItem(FTUE_STORAGE_KEY, 'true');
        if (onComplete) {
            await onComplete();
        }
    }, [onComplete]);

    const skipTour = useCallback(async () => {
        await finishTour();
    }, [finishTour]);

    const completeTour = useCallback(async () => {
        await finishTour();
    }, [finishTour]);

    return {
        isActive: state.isActive,
        currentStep: state.currentStep,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour
    };
};

// Helper to check if FTUE was completed locally (before profile loads)
export const isFTUECompletedLocally = (): boolean => {
    return localStorage.getItem(FTUE_STORAGE_KEY) === 'true';
};
