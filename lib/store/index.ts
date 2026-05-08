import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PreferenceProfile {
  sliders: { budget: number; pace: number; indoor: number };
  interest_tags: string[];
  dietary: string[];
  accessibility: string[];
}

export interface Trip {
  id: string;
  destinationId: string;
  startDate: string;
  endDate: string;
  partyShape: 'solo' | 'couple' | 'family' | 'group';
  status: 'draft' | 'finalised' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export interface ItineraryActivity {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  title: string;
  googlePlaceId: string | null;
  intensity: 'low' | 'med' | 'high';
}

export interface ItineraryDay {
  date: string;
  activities: ItineraryActivity[];
}

export interface Itinerary {
  id: string;
  version: number;
  payload: {
    days: ItineraryDay[];
  };
}

interface AppState {
  preferences: PreferenceProfile;
  trips: Trip[];
  itineraries: Record<string, Itinerary>;
  setPreferences: (prefs: Partial<PreferenceProfile>) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  setItinerary: (tripId: string, itinerary: Itinerary) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      preferences: {
        sliders: { budget: 50, pace: 50, indoor: 50 },
        interest_tags: [],
        dietary: [],
        accessibility: [],
      },
      trips: [],
      itineraries: {},
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      addTrip: (trip) =>
        set((state) => ({
          trips: [...state.trips, trip],
        })),
      updateTrip: (tripId, updates) =>
        set((state) => ({
          trips: state.trips.map((t) => (t.id === tripId ? { ...t, ...updates } : t)),
        })),
      setItinerary: (tripId, itinerary) =>
        set((state) => ({
          itineraries: {
            ...state.itineraries,
            [tripId]: itinerary,
          },
        })),
    }),
    {
      name: 'tripulse-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
