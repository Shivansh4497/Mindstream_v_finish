// Basic setup for happy-dom environment
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('../services/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn(),
            updateUser: vi.fn(),
        },
    },
}));

// Mock console to keep test output clean
global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
};
