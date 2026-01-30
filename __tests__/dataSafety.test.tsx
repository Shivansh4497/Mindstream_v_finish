import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '../services/dbService';
import { supabase } from '../services/supabaseClient';

// Test Suite for Data Safety (Soft Deletes)
describe('Data Safety: Soft Deletes', () => {

    // Mock Setup
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnValue({ data: {}, error: null });
    const mockDelete = vi.fn().mockReturnValue({ data: {}, error: null });

    // Default chain for 'update' flow (Soft Delete)
    // from() -> update() -> eq()
    const mockFromUpdate = vi.fn().mockReturnValue({
        update: mockUpdate,
        delete: mockDelete, // Should NOT be called
    });
    mockUpdate.mockReturnValue({ eq: mockEq });

    // Spy on Supabase client
    beforeEach(() => {
        vi.clearAllMocks();
        (supabase.from as any) = mockFromUpdate;
    });

    it('deleteEntry should perform a SOFT DELETE (update deleted_at)', async () => {
        const entryId = 'test-entry-123';

        await db.deleteEntry(entryId);

        // Verify correct table selected
        expect(supabase.from).toHaveBeenCalledWith('entries');

        // Verify update was called NOT delete
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockDelete).not.toHaveBeenCalled();

        // Verify payload contains deleted_at
        const updatePayload = mockUpdate.mock.calls[0][0];
        expect(updatePayload).toHaveProperty('deleted_at');
        expect(new Date(updatePayload.deleted_at).toISOString()).toBeTruthy(); // Valid timestamp

        // Verify ID targeting
        expect(mockEq).toHaveBeenCalledWith('id', entryId);
    });

    it('deleteIntention should perform a SOFT DELETE', async () => {
        const intentionId = 'test-goal-123';

        await db.deleteIntention(intentionId);

        expect(supabase.from).toHaveBeenCalledWith('intentions');
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockDelete).not.toHaveBeenCalled();

        const updatePayload = mockUpdate.mock.calls[0][0];
        expect(updatePayload).toHaveProperty('deleted_at');
    });

    it('deleteHabit should perform a SOFT DELETE', async () => {
        const habitId = 'test-habit-123';

        await db.deleteHabit(habitId);

        expect(supabase.from).toHaveBeenCalledWith('habits');
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockDelete).not.toHaveBeenCalled();

        const updatePayload = mockUpdate.mock.calls[0][0];
        expect(updatePayload).toHaveProperty('deleted_at');
    });

    it('deleteUserChatFeedback should perform a SOFT DELETE', async () => {
        const userId = 'user-123';
        const mockEqUser = vi.fn().mockReturnValue({ data: {}, error: null });
        mockUpdate.mockReturnValue({ eq: mockEqUser });

        await db.deleteUserChatFeedback(userId);

        expect(supabase.from).toHaveBeenCalledWith('chat_feedback');
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockDelete).not.toHaveBeenCalled();

        const updatePayload = mockUpdate.mock.calls[0][0];
        expect(updatePayload).toHaveProperty('deleted_at');
    });
});
