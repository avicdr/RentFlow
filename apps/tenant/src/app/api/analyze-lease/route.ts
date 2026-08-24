import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { jwtVerify } from 'jose';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const ANALYSIS_PROMPT = `You are an expert Indian property law consultant specializing in rental agreements under the Transfer of Property Act 1882, Rent Control Acts, and RERA guidelines.

Analyze this lease/rental agreement document and return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this exact structure:
{
  "riskScore": <integer 0-100, where 0=safe, 100=very risky>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "<2-3 sentence overview of the agreement>",
  "clauses": [
    {
      "id": "<unique-id like clause-1>",
      "title": "<clause category name>",
      "originalText": "<exact problematic text from document, max 200 chars>",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "issue": "<plain English explanation of the problem>",
      "suggestion": "<fairer alternative clause text>",
      "legalReference": "<relevant Indian law section, e.g. Section 108, TPA 1882>"
    }
  ],
  "positives": ["<list of fair/good clauses found>"],
  "keyTerms": {
    "rentAmount": "<monthly rent if found>",
    "securityDeposit": "<deposit if found>",
    "leaseDuration": "<duration e.g. 11 months>",
    "noticePeriod": "<notice period e.g. 1 month>",
    "maintenanceResponsibility": "<who pays maintenance>"
  }
}

Focus on: lock-in clauses, excessive penalties, unreasonable landlord entry rights, hidden charges, automatic renewal traps, forfeiture of security deposit, unreasonable maintenance liability, and clauses that violate Indian rental laws.`;

/** Verify the JWT from the Authorization header or cookie. Returns false if invalid. */
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    if (!secret || secret.length === 0) return false;

    // Try Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies.get('rf_tenant_token')?.value;

    if (!token) return false;

    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Require authentication — prevent unauthenticated Gemini API quota abuse
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const message = formData.get('message') as string | null;
    const history = formData.get('history') as string | null;

    if (!file && !message) {
      return NextResponse.json({ error: 'Provide either a file to analyze or a chat message' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    if (file) {
      // Analyze the uploaded lease document
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mimeType = (file.type && file.type !== 'application/octet-stream') ? file.type : 'application/pdf';

      const result = await model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        ANALYSIS_PROMPT,
      ]);

      const text = result.response.text().trim();

      try {
        // Extract JSON even if there's surrounding text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[0] ?? text);
        return NextResponse.json({ type: 'analysis', data: parsed });
      } catch {
        // If JSON parsing fails, return a structured fallback
        return NextResponse.json({
          type: 'analysis',
          data: {
            riskScore: 50,
            riskLevel: 'MEDIUM',
            summary: text.slice(0, 400),
            clauses: [],
            positives: [],
            keyTerms: {},
          },
        });
      }
    } else {
      // Chatbot follow-up
      const chatHistory = history ? JSON.parse(history) : [];
      const contextStr = chatHistory.slice(-6).map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n');

      const chatPrompt = `You are an expert Indian property law consultant helping a tenant understand their rental agreement.

Previous conversation:
${contextStr}

Tenant's question: ${message}

Answer helpfully and concisely. Focus on practical advice for Indian tenants. If the question is about a specific clause, be precise. Keep your response under 200 words.`;

      const result = await model.generateContent([chatPrompt]);
      const text = result.response.text().trim();

      return NextResponse.json({ type: 'chat', message: text });
    }
  } catch (err: unknown) {
    // Log the real error server-side; return a safe generic message to the client
    console.error('[Lease Analyzer] Error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
