import { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export interface AppBanner {
    enabled: boolean;
    title: string;
    description: string;
    type: 'info' | 'promo' | 'alert';
    ctaText?: string;
    ctaAction?: string; // e.g. 'pricing', 'onboarding'
}

export interface AppConfig {
    headline: {
        main: string;
        accent: string;
    };
    banners: AppBanner[];
    featuredStyles: {
        id: string;
        icon: string;
        label: string;
        desc: string;
    }[];
    quickPrompts: string[];
    pricing: {
        currency: string;
        plans: {
            hobbyist: {
                name: string;
                price: number;
                perks: string[];
            };
            founder: {
                name: string;
                monthlyPrice: number;
                yearlyPrice: number;
                perks: string[];
                badge?: string;
            };
        };
    };
}

const DEFAULT_CONFIG: AppConfig = {
    headline: {
        main: "Name your",
        accent: "next big thing."
    },
    banners: [],
    featuredStyles: [
        { id: 'Neo-Latin', icon: 'auto_awesome', label: 'Modern Latin', desc: 'Professional' },
        { id: 'Compound', icon: 'join_inner', label: 'Mix of Words', desc: 'Combining ideas' },
        { id: 'Real Word', icon: 'title', label: 'Simple Words', desc: 'Dictionary words' },
        { id: 'Descriptive', icon: 'description', label: 'Descriptive', desc: 'Explains your idea' },
        { id: 'Phrase', icon: 'format_quote', label: 'Short Phrases', desc: 'Multiple words' },
        { id: 'Humorous', icon: 'sentiment_very_satisfied', label: 'Funny Names', desc: 'Creative and fun' },
        { id: 'Abstract', icon: 'bubble_chart', label: 'Creative Sounds', desc: 'Short and catchy' },
    ],
    quickPrompts: [
        "SaaS for Dog Walkers",
        "AI Legal Assistant",
        "Sustainable Coffee Brand",
        "Fitness Tracker App"
    ],
    pricing: {
        currency: '$',
        plans: {
            hobbyist: {
                name: 'Hobbyist',
                price: 0,
                perks: ['3 names per day', 'Basic AI styles', 'View history', 'Standard results']
            },
            founder: {
                name: 'Founder Pro',
                monthlyPrice: 15,
                yearlyPrice: 12,
                badge: 'Popular',
                perks: ['Unlimited generations', 'All premium AI styles', 'Domain availability check', 'Full history access', 'Priority support']
            }
        }
    }
};

/**
 * Hook for real-time app configuration
 */
export const useAppConfig = () => {
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[Config] Subscribing to app_config/global...');
        const unsubscribe = onSnapshot(doc(db, 'app_config', 'global'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                console.log('[Config] Success! Raw Data:', data);
                if (data.pricing) console.log('[Config] Pricing Data Found:', data.pricing);
                (window as any).firestore_status = 'Connected';

                // Robust Deep Merge
                const mergedConfig: AppConfig = {
                    ...DEFAULT_CONFIG,
                    ...data,
                    headline: {
                        ...DEFAULT_CONFIG.headline,
                        ...(data.headline || {})
                    },
                    pricing: {
                        ...DEFAULT_CONFIG.pricing,
                        ...(data.pricing || {}),
                        currency: data.currency || data.pricing?.currency || DEFAULT_CONFIG.pricing.currency,
                        plans: {
                            hobbyist: {
                                ...DEFAULT_CONFIG.pricing.plans.hobbyist,
                                ...(data.hobbyist || data.pricing?.hobbyist || data.pricing?.plans?.hobbyist || {})
                            },
                            founder: {
                                ...DEFAULT_CONFIG.pricing.plans.founder,
                                ...(data.founder || data.pricing?.founder || data.pricing?.plans?.founder || {})
                            }
                        }
                    },
                    featuredStyles: data.featuredStyles || DEFAULT_CONFIG.featuredStyles
                };

                setConfig(mergedConfig);
            } else {
                console.warn('[Config] Document missing at app_config/global');
                (window as any).firestore_status = 'Doc Missing';
                setConfig(DEFAULT_CONFIG);
            }
            setLoading(false);
        }, (error) => {
            console.error("[Config] Error:", error);
            (window as any).firestore_last_error = error.message;
            (window as any).firestore_status = 'Error';
            // Show alert once for debugging
            if (loading) {
                console.warn("Firestore Sync Error: " + error.message);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { config, loading };
};

/**
 * Fetch one-time configuration
 */
export const getAppConfig = async (): Promise<AppConfig> => {
    try {
        const configDoc = await getDoc(doc(db, 'app_config', 'global'));
        if (configDoc.exists()) {
            return { ...DEFAULT_CONFIG, ...configDoc.data() } as AppConfig;
        }
    } catch (e) {
        console.error("[Config] One-time fetch failed:", e);
    }
    return DEFAULT_CONFIG;
};
