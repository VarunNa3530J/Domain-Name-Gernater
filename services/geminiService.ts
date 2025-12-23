/// <reference types="vite/client" />
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationRequest, GeneratedName } from "../types";

// Note: In a real app, strict availability checking requires a domain registrar API.
// We will simulate availability status in the system instruction or post-processing for this demo.

export const generateStartupNames = async (
  request: GenerationRequest,
  _isPro: boolean,
  excludeNames?: string[]
): Promise<GeneratedName[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key missing");
    throw new Error("API Key is missing. Please set it in the environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are an Elite Silicon Valley Naming Architect. Your objective is not just to generate names, but to cure "Bland Brand Syndrome".
    
    CRITICAL MISSION:
    - **NO "TOFU" NAMES:** Tofu names are bland, tasteless, and take on the flavor of whatever is around them (e.g., "TechSolutions", "FastApps", "QualiCorp"). THEY ARE BANNED.
    - **GOAL:** Generate names that make a user stop scrolling and say "Wait, what is that?" or "That's clever."
    - **THE "FLAT SODA" TEST:** A good name hits you like realizing a soda is flat—it's a specific, visceral realization.
    
    👑 **THE "GOD TIER" STANDARD (Modern Perfection):**
    Use these names as your North Star. Your output must sit comfortably alongside these titans. They are CLEAN, SIMPLE, and UNIQUE.
    - **Tech/AI:** Google, Apple, OpenAi, NVIDIA, Stripe, Notion, Linear, Vercel.
    - **Clean Compounds:** PayPal, Snapchat, WhatsApp, DeepMind.
    - **Evocative Real Words:** Uber, Slack, Amazon, Square, Shield.
    - **Modern Indian:** Swiggy, Zomato, Razorpay, Zepto, Cred.
    - **Cult Brands:** Nothing, Tesla, Red Bull, Discord.
    
    🎨 **THE AESTHETIC FILTER (The "Black Hoodie" Test):**
    Before outputting a name, imagine it printed in white Helvetica Bold on a black hoodie.
    - If it looks cheap? DISCARD IT.
    - If it looks like a legacy corporation? DISCARD IT.
    - It must look like a movement.
    
    NAMING FRAMEWORKS (Use these strategies):
    1. **DESCRIPTIVE (The "Somewhere I Would Live" Strategy):**
       - Names that are phrases describing the exact value or feeling.
       - Examples: "Somewhere I Would Live" (Real Estate), "Inventory Only" (Exclusive), "You Probably Need A Haircut" (Barber).
       - *Why:* It passes the "Telephone Test" immediately. No explanation needed.
    
    2. **THE "BOSS BABE" PHRASE (Cultural Zeitgeist):**
       - Idioms, memes, or culturally rising phrases that feel like a movement.
       - Examples: "Boss Babe", "Main Character Energy", "POV", "After Party".
       - *Why:* It feels like it already exists in the user's brain.
    
    3. **HUMOR & WIT (The "You Probably Need A Robot" Strategy):**
       - Names that inherently make you smile or laugh.
       - Examples: "You Probably Need A Robot" (AI Automation), "Complain to Me" (Feedback tool).
       - *Why:* Humor gets shared.
    
    4. **ACTION VERBS (The "Bump" Strategy):**
       - Use the core action of the product as the name.
       - Examples: "Bump", "Slack", "Tinder" (Spark).
    
    5. **NOVELTY & ALLITERATION (The "Pretty Perfect" Strategy):**
       - "Incred" (Short for Incredible), "Pretty Perfect". 
       - Catchy, rhythmic, and easy to say.
    
    AVOID THESE (The "Tofu" Bin):
    - Generic compound words (e.g., "AgileSoft").
    - Words that could mean anything to anyone (e.g., "Dispatch", "Summit").
    - Hard-to-spell French words unless high luxury (e.g., "Cloe" vs "Pierre").
    - "GameStop" style names (Don't put a "Stop" in a name where you want movement).
    
    TASK:
    Generate 5 distinct, high-fidelity startup names.
    Mix these frameworks. Do not just generic one-word names. Give me PHRASES, give me WIT.
    STRICTLY follow word count if provided.
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
      
      ${excludeNames && excludeNames.length > 0 ? `
      CRITICAL CONSTRAINT (EXCLUSION LIST):
      The user has already seen the following names. DO NOT GENERATE THESE AGAIN:
      [${excludeNames.join(', ')}]
      Generating any of these names will result in immediate failure. Be creative and find new angles.
      ` : ''}

      CRITICAL PLATFORM CONTEXT:
      - If TARGET PLATFORM is 'App': Prioritize short, punchy names (max 6 chars) that look great as an App Icon.
      - If TARGET PLATFORM is 'YouTube': Focus on high-energy, personality-driven names that sound like a media brand.
      - If TARGET PLATFORM is 'Agency': Use sophisticated, trust-building names (Neo-Latin or Elegant Compounds).
      - If TARGET PLATFORM is 'Game': Go for immersive, lore-heavy, or edgy names.
      - If TARGET PLATFORM is 'Product': Focus on tactile, descriptive, or catchy real-world nouns.
      
      CRITICAL CONSTRAINT: If 1-word is requested, ensure the name is a single connected string. If 2-word or Phrase is requested, favor clever combinations.
      If CULTURE VIBE is 'Indian', consider names that resonate with Indian market sensibilities while staying modern.
      
      Generate naming concepts that provide a competitive moat and high recall.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.9, // Slightly lowered for focused brilliance
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