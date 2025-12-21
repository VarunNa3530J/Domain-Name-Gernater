/// <reference types="vite/client" />
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationRequest, GeneratedName } from "../types";

// Note: In a real app, strict availability checking requires a domain registrar API.
// We will simulate availability status in the system instruction or post-processing for this demo.

export const generateStartupNames = async (
  request: GenerationRequest,
  _isPro: boolean
): Promise<GeneratedName[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key missing");
    throw new Error("API Key is missing. Please set it in the environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are an Elite Silicon Valley Naming Architect. Your objective is to engineer "Sovereign-Class" startup identities that command instant market authority.
    
    CORE PHILOSOPHY:
    - DISRUPT CONVENTION: Avoid "Tofu" names (e.g., TechSolutions, FastApps). If it sounds like a generic template, discard it.
    - PHONESTHETIC IMPACT: Prioritize names with high-impact phonetics (Hard consonants: K, X, Z, T). 
    - THE TELEPHONE TEST: Must be spellable and understandable over a crackly phone line.
    - COGNITIVE EASE: Names should feel familiar yet entirely new.
    
    NAMING TIERS (Categorization Logic):
    1. NEO-LATIN: Sophisticated, root-based constructs that imply ancient trust (e.g., "Vercel", "Attic").
    2. COMPOUND: Two real words fused for a new meaning, avoiding lazy clichés (e.g., "AirBnB", "DoorDash").
    3. REAL WORD: Repurposing common nouns/verbs to own a concept (e.g., "Square", "Slack", "Linear").
    4. DESCRIPTIVE: Transparent names that immediately convey value or function (e.g., "Coinbase", "Wealthfront").
    5. PHRASE-BASED: Idiomatic or clever combinations that feel like a call to action (e.g., "Cash App", "Take Two").
    6. HUMOROUS: Names with wit, personality, or memorable puns (e.g., "Gullibull", "Sofa King").
    7. ABSTRACT: Purely phonetic, evocative sounds that act as a blank canvas (e.g., "Kore", "Qoom").
    
    BANNED PATTERNS (CRITICAL):
    - NO lazy suffixes like "-ify", "-ly", or "-app" unless it's a very clever phrase.
    - NO literal boring descriptions like "FoodDelivery".
    - NO names longer than 15 characters for phrases, 12 for others.
    
    TASK:
    Generate 5 distinct, high-fidelity startup names based on the input.
    Strictly follow the user's word count preference if provided.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['Neo-Latin', 'Compound', 'Real Word', 'Abstract', 'Descriptive', 'Phrase', 'Humorous'] },
        reasoning: { type: Type.STRING },
        domainExtensions: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["name", "type", "reasoning", "domainExtensions"],
    },
  };

  try {
    const prompt = `
      TARGET DOMAIN/IDEA: ${request.description}
      INDUSTRY: ${request.industry || 'Tech'}
      TARGET AUDIENCE: ${request.audience || 'General'}
      PREFERRED ARCHETYPE: ${request.style}
      TONE PROFILE: ${request.tone}
      TARGET PLATFORM: ${request.target || 'General Business'}
      CULTURE VIBE: ${request.vibe || 'Global/Western'}
      ${request.keywords ? `REQUISITE KEYWORDS: ${request.keywords}` : ''}
      WORD STRUCTURE PREFERENCE: ${request.wordCount || 'Any'}
      
      CRITICAL CONSTRAINT: If 1-word is requested, ensuring the name is a single connected string. If 2-word or Phrase is requested, favor clever combinations.
      If TARGET PLATFORM is 'App', prioritize names that work well as app store icons and short labels.
      If CULTURE VIBE is 'Indian', consider names that resonate with Indian market sensibilities while staying modern.
      
      Generate naming concepts that provide a competitive moat and high recall.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 1.0, // Maximum neural variability for distinctiveness
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);

    // Post-process to add simulated domain availability and IDs
    return rawData.map((item: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      name: item.name,
      archetype: item.type,
      reasoning: item.reasoning,
      domains: item.domainExtensions.map((tld: string) => ({
        tld: tld,
        // Simulate availability: .com is harder to get, others easier
        available: tld === '.com' ? Math.random() > 0.7 : Math.random() > 0.3,
        premium: Math.random() > 0.8
      }))
    }));

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback data for demo purposes if API fails or quota exceeded
    return [
      {
        id: "err-1",
        name: "Velocify",
        archetype: "Neo-Latin",
        reasoning: "Implies speed and action instantly.",
        domains: [
          { tld: ".io", available: true, premium: false },
          { tld: ".com", available: false, premium: true }
        ]
      },
      {
        id: "err-2",
        name: "Second Brain",
        archetype: "Abstract",
        reasoning: "Cultural reference to productivity.",
        domains: [
          { tld: ".ai", available: true, premium: false }
        ]
      }
    ];
  }
};