import { describe, it, expect } from 'vitest';
import { ItineraryResponseSchema } from './schema';

describe('ItineraryResponseSchema', () => {
  it('should validate a correct itinerary', () => {
    const validData = {
      days: [
        {
          date: '2024-01-01',
          activities: [
            {
              id: 'place-tokyo-skytree',
              startTime: '09:00',
              endTime: '11:00',
              type: 'landmark',
              title: 'Visit Skytree',
              intensity: 'low'
            }
          ]
        }
      ]
    };
    
    const result = ItineraryResponseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail on missing required fields', () => {
    const invalidData = {
      days: [
        {
          date: '2024-01-01',
          activities: [
            {
              id: 'place-tokyo-skytree',
              startTime: '09:00',
              // missing endTime, type, title, intensity
            }
          ]
        }
      ]
    };
    
    const result = ItineraryResponseSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
