import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('useAppStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useAppStore.setState({
      preferences: { sliders: { budget: 50, pace: 50, indoor: 50 }, interest_tags: [], dietary: [], accessibility: [] },
      trips: [],
      itineraries: {},
    });
  });

  it('should initialize with default preferences', () => {
    const state = useAppStore.getState();
    expect(state.preferences.sliders.budget).toBe(50);
  });

  it('should update preferences', () => {
    useAppStore.getState().setPreferences({ sliders: { budget: 80, pace: 50, indoor: 50 } });
    const state = useAppStore.getState();
    expect(state.preferences.sliders.budget).toBe(80);
  });

  it('should add a trip', () => {
    const trip = {
      id: 'trip-1',
      destinationId: 'tokyo-jp',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      partyShape: 'solo' as const,
      status: 'draft' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    useAppStore.getState().addTrip(trip);
    const state = useAppStore.getState();
    expect(state.trips).toHaveLength(1);
    expect(state.trips[0].id).toBe('trip-1');
  });
});
