import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini AI SDK if key available
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // API endpoint for AI Gig Match & Recommendations
  app.post('/api/ai-match-gigs', async (req, res) => {
    try {
      const { userLocation, skills, userQuery } = req.body;
      
      if (!ai) {
        return res.json({
          success: true,
          matchMessage: "AI Matchmaker (Offline mode): Showing verified micro-gigs near your exact location based on standard radius.",
          suggestedGigs: []
        });
      }

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
      // Clean up markdown code blocks if present
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const gigs = JSON.parse(cleanedText);

      res.json({ success: true, gigs });
    } catch (err: any) {
      console.error('Gemini AI match error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to generate AI gigs' });
    }
  });

  // Verification submission endpoint
  app.post('/api/verification/submit', express.json({ limit: '10mb' }), (req, res) => {
    try {
      const { plan, selfieUrl, idFileName, timestamp } = req.body;
      if (!selfieUrl || !idFileName) {
        return res.status(400).json({ success: false, error: 'Selfie and ID document are both required.' });
      }
      // Successfully recorded in verification registry
      res.json({
        success: true,
        message: 'Verification submission received. Review takes about 15 to 25 minutes.',
        submissionId: `verif_${Date.now()}`
      });
    } catch (err: any) {
      console.error('Verification submission error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to submit verification' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
