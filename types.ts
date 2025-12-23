export type Page = 'login' | 'register' | 'dashboard' | 'results' | 'pricing' | 'account' | 'history' | 'settings' | 'admin' | 'terms' | 'privacy';

export type PlanType = 'free' | 'pro';

export type WordCountPreference = '1-word' | '2-word' | 'both';

export type TargetPlatform = 'Business' | 'App' | 'Website' | 'Service' | 'YouTube' | 'Agency' | 'Product' | 'Game';

export type CultureVibe = 'Global' | 'Indian' | 'American' | 'European' | 'Asian';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  planInterval?: 'monthly' | 'yearly';
  planExpiresAt?: string; // ISO String
  isPlanActive?: boolean;
  credits: number;
  generationsTodayCount: number;
  lastGenerationDate: string;
  avatarUrl: string;
  role?: 'admin' | 'user';
}

export type NamingStyle = 'Neo-Latin' | 'Compound' | 'Real Word' | 'Abstract' | 'Descriptive' | 'Phrase' | 'Humorous';
export type Tone = 'Premium' | 'Fun' | 'Modern' | 'Bold' | 'Minimalist' | 'Tech' | 'Luxury';
export type NameLength = 'Short' | 'Medium' | 'Any';

export interface GeneratedName {
  id: string;
  name: string;
  archetype: NamingStyle;
  reasoning: string;
  domains: {
    tld: string;
    available: boolean; // Simulation
    premium: boolean;
  }[];
  isLocked?: boolean; // For visual UI logic
}

export interface GenerationRequest {
  description: string;
  style: NamingStyle;
  tone: Tone;
  keywords?: string;
  maxLength?: NameLength;
  wordCount?: WordCountPreference;
  target?: TargetPlatform;
  vibe?: CultureVibe;
  industry?: string;
  audience?: string;
}