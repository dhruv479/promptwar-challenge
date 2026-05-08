import { z } from 'zod';

export const ItineraryActivitySchema = z.object({
  id: z.string().describe("Must match a place id from the provided candidate list"),
  startTime: z.string().describe("HH:MM format, e.g. 09:00"),
  endTime: z.string().describe("HH:MM format, e.g. 11:30"),
  type: z.string(),
  title: z.string(),
  intensity: z.enum(['low', 'med', 'high']),
});

export const ItineraryDaySchema = z.object({
  date: z.string().describe("YYYY-MM-DD format"),
  activities: z.array(ItineraryActivitySchema),
});

export const ItineraryResponseSchema = z.object({
  days: z.array(ItineraryDaySchema),
});

export type GeneratedItinerary = z.infer<typeof ItineraryResponseSchema>;
