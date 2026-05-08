import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import placesCatalog from '@/lib/db/places.json';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // In local dev without credentials, we might skip full verification if admin fails to init.
    // For now, assume it's enforced unless it's the mock token.
    if (idToken !== 'mock_token_for_dev') {
      try {
        await getAdminAuth().verifyIdToken(idToken);
      } catch (error) {
        console.error('Token verification failed:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // 2. Parse request body
    const body = await req.json();
    const { destinationId, startDate, endDate, preferences } = body;

    if (!destinationId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Filter candidates from static catalogue
    const candidates = placesCatalog.filter(p => p.destinationId === destinationId);

    // 4. Construct LLM prompt
    const prompt = `
      You are an expert travel planner. Create an itinerary for destination: ${destinationId}.
      Dates: ${startDate} to ${endDate}.
      User preferences: ${JSON.stringify(preferences)}.
      
      You must ONLY use the following candidate places:
      ${JSON.stringify(candidates, null, 2)}
      
      Return a JSON object EXACTLY conforming to this schema (no markdown blocks, just raw JSON):
      {
        "days": [
          {
            "date": "YYYY-MM-DD",
            "activities": [
              {
                "id": "Must match a place id from the provided candidate list",
                "startTime": "HH:MM",
                "endTime": "HH:MM",
                "type": "string",
                "title": "string",
                "intensity": "low" | "med" | "high"
              }
            ]
          }
        ]
      }
      Ensure times are logical and travel time is considered.
    `;

    // 5. Call Gemini
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    let textResponse = result.response.text();
    
    if (!textResponse) {
      throw new Error('No content generated');
    }

    // Clean up markdown block if present
    textResponse = textResponse.replace(/^```json/im, '').replace(/^```/im, '').replace(/```$/im, '').trim();

    // 6. Return the JSON
    const parsedData = JSON.parse(textResponse);
    return NextResponse.json({ itinerary: parsedData });

  } catch (error: unknown) {
    console.error('Generation Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
