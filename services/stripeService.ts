export interface CheckoutSessionResponse {
    id: string;
    url: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const stripeService = {
    /**
     * Initiates a Stripe Checkout session by calling our local backend bridge.
     */
    async createCheckoutSession(userId: string, planId: string, planName: string): Promise<void> {
        console.log(`[Stripe Service] Creating session for user: ${userId}, plan: ${planId}`);

        try {
            const response = await fetch(`${API_URL}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    priceId: planId, // This maps to the Stripe Price ID in the backend
                    planName,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create checkout session');
            }

            const session: CheckoutSessionResponse = await response.json();

            // Redirect to Stripe Checkout
            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error('No checkout URL received from server');
            }
        } catch (error) {
            console.error('[Stripe Service] Error:', error);
            throw error;
        }
    }
};
