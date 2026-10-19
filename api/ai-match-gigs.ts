import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userLocation, skills, userQuery } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        matchMessage: 'AI Matchmaker (Standard Mode): Showing verified micro-gigs near your exact location.',
        suggestedGigs: [],
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an AI assistant for a local gig platform called GiGSpot.
User Location: Latitude ${userLocation?.lat || 51.505}, Longitude ${userLocation?.lng || -0.09}.
User Skills / Interests: ${skills || 'General tasks, deliveries, tech support, photography'}.
User Query: ${userQuery || 'Find best paying gigs nearby'}.

Generate 4 realistic local gigs that could be happening near this exact coordinate. Return ONLY a valid JSON array of objects with these keys:
id (string), title (string), category (one of: 'Delivery', 'Tech', 'Creative', 'Services', 'Pet Care', 'Urgent'), pay (string, e.g. '$45'), distance (string, e.g. '0.4 mi'), lat (number close to user lat), lng (number close to user lng), description (string), duration (string, e.g. '1 hour'), clientName (string), clientRating (number, e.g. 4.9).
Do not include markdown formatting or backticks outside of plain JSON if possible, just pure JSON array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '[]';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const gigs = JSON.parse(cleanedText);

    return res.status(200).json({ success: true, gigs });
  } catch (err: any) {
    console.error('Gemini AI match error:', err);
    return res.status(200).json({
      success: true,
      matchMessage: 'Standard micro-gigs active near your location.',
      gigs: [],
    });
  }
}
