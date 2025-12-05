import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/dbService';
import { UserFlags } from '../services/dbService';

/**
 * Custom hook for managing user flags with server-side persistence
 * and localStorage fallback/migration.
 * 
 * Features:
 * - Fetches flags from server on mount
 * - Falls back to localStorage while loading
 * - One-time migration from localStorage to server
 * - Optimistic updates with background sync
 */
export const useServerFlags = (userId: string | undefined) => {
    const [flags, setFlags] = useState<UserFlags>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Generate localStorage keys for this user
    const getLocalStorageKeys = useCallback((uid: string) => ({
        onboardingStep: `onboardingStep_${uid}`,
        hasSeenFirstInsight: `hasSeenFirstInsight_${uid}`,
        hasVisitedInsights: `hasVisitedInsights_${uid}`,
        migrated: `flags_migrated_${uid}`,
    }), []);

    // Load flags from localStorage (for fallback/migration)
    const loadFromLocalStorage = useCallback((uid: string): UserFlags => {
        const keys = getLocalStorageKeys(uid);
        try {
            const onboardingStepRaw = localStorage.getItem(keys.onboardingStep);
            const hasSeenFirstInsightRaw = localStorage.getItem(keys.hasSeenFirstInsight);
            const hasVisitedInsightsRaw = localStorage.getItem(keys.hasVisitedInsights);

            return {
                onboardingStep: onboardingStepRaw ? JSON.parse(onboardingStepRaw) : undefined,
                hasSeenFirstInsight: hasSeenFirstInsightRaw ? JSON.parse(hasSeenFirstInsightRaw) : undefined,
                hasVisitedInsights: hasVisitedInsightsRaw ? JSON.parse(hasVisitedInsightsRaw) : undefined,
            };
        } catch (e) {
            console.warn('Error loading flags from localStorage:', e);
            return {};
        }
    }, [getLocalStorageKeys]);

    // Clear localStorage flags after successful migration
    const clearLocalStorageFlags = useCallback((uid: string) => {
        const keys = getLocalStorageKeys(uid);
        try {
            localStorage.removeItem(keys.onboardingStep);
            localStorage.removeItem(keys.hasSeenFirstInsight);
            localStorage.removeItem(keys.hasVisitedInsights);
            localStorage.setItem(keys.migrated, 'true');
        } catch (e) {
            console.warn('Error clearing localStorage flags:', e);
        }
    }, [getLocalStorageKeys]);

    // Check if migration has already been done
    const hasMigrated = useCallback((uid: string): boolean => {
        const keys = getLocalStorageKeys(uid);
        return localStorage.getItem(keys.migrated) === 'true';
    }, [getLocalStorageKeys]);

    // Load flags from server (with migration)
    useEffect(() => {
        if (!userId) return;

        const loadFlags = async () => {
            try {
                // First, try to load from server
                const serverFlags = await db.getUserFlags(userId);

                // Check if we need to migrate from localStorage
                if (!hasMigrated(userId)) {
                    const localFlags = loadFromLocalStorage(userId);

                    // If we have local flags but not server flags, migrate
                    const hasLocalFlags = Object.values(localFlags).some(v => v !== undefined);
                    const hasServerFlags = Object.values(serverFlags).some(v => v !== undefined);

                    if (hasLocalFlags && !hasServerFlags) {
                        console.log('[useServerFlags] Migrating flags from localStorage to server...');
                        await db.updateUserFlags(userId, localFlags);
                        setFlags(localFlags);
                        clearLocalStorageFlags(userId);
                    } else {
                        // Use server flags (or merged if both exist)
                        setFlags(serverFlags);
                        clearLocalStorageFlags(userId);
                    }
                } else {
                    // Already migrated, just use server flags
                    setFlags(serverFlags);
                }
            } catch (e) {
                console.warn('[useServerFlags] Failed to load from server, using localStorage fallback:', e);
                setFlags(loadFromLocalStorage(userId));
            } finally {
                setIsLoaded(true);
            }
        };

        loadFlags();
    }, [userId, loadFromLocalStorage, clearLocalStorageFlags, hasMigrated]);

    // Update a single flag (optimistic update + background sync)
    const setFlag = useCallback(<K extends keyof UserFlags>(key: K, value: UserFlags[K]) => {
        setFlags(prev => ({ ...prev, [key]: value }));

        // Background sync to server
        if (userId) {
            db.updateUserFlags(userId, { [key]: value }).catch(e => {
                console.warn(`[useServerFlags] Failed to sync flag "${key}" to server:`, e);
            });
        }
    }, [userId]);

    return {
        flags,
        isLoaded,
        setFlag,
        // Convenience getters with defaults
        onboardingStep: flags.onboardingStep ?? 0,
        hasSeenFirstInsight: flags.hasSeenFirstInsight ?? false,
        hasVisitedInsights: flags.hasVisitedInsights ?? false,
        // Convenience setters
        setOnboardingStep: (step: number) => setFlag('onboardingStep', step),
        setHasSeenFirstInsight: (seen: boolean) => setFlag('hasSeenFirstInsight', seen),
        setHasVisitedInsights: (visited: boolean) => setFlag('hasVisitedInsights', visited),
    };
};
