import express from 'express';
import stripePackage from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());

// Add persistent logging
import fs from 'fs';
app.use((req, res, next) => {
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
    fs.appendFileSync('access.log', log);
    console.log(log);
    next();
});

// Webhook handler needs raw body
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const interval = session.metadata.interval; // 'month' or 'year'

        console.log(`[Stripe Webhook] Payment successful for user: ${userId}, Interval: ${interval}`);

        // Calculate Expiration Date
        const planExpiresAt = new Date();
        if (interval === 'year') {
            planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
            planExpiresAt.setDate(planExpiresAt.getDate() + 1); // Buffer
        } else {
            planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
            planExpiresAt.setDate(planExpiresAt.getDate() + 1); // Buffer
        }

        /* 
           To integrate with Firebase on the server, you would typically use firebase-admin.
           Since we are in a bridge setup, we'll log the intention.
           In a real production environment, you'd run:
           await admin.firestore().collection('users').doc(userId).update({
               plan: 'pro',
               planExpiresAt: planExpiresAt.toISOString(),
               isPlanActive: true
           });
        */
        console.log(`[Stripe Webhook] Intended Firestore Update: plan='pro', expiresAt=${planExpiresAt.toISOString()}`);
    }

    res.json({ received: true });
});

app.use(express.json());

import { v2 as cloudinary } from 'cloudinary';

// ... (keep existing code)
app.use(express.json());

// Cloudinary Config - Lazy load from env
const getCloudinaryConfig = () => ({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.post('/api/sign-cloudinary', (req, res) => {
    try {
        const timestamp = Math.round((new Date).getTime() / 1000);
        const config = getCloudinaryConfig();

        if (!config.api_secret) {
            throw new Error('Cloudinary API Secret not found in server environment.');
        }

        // Signature for unsigned/signed upload
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            folder: 'namelime_assets', // Optional: organize uploads
        }, config.api_secret);

        res.json({
            signature,
            timestamp,
            cloudName: config.cloud_name,
            apiKey: config.api_key
        });
    } catch (error) {
        console.error('[Cloudinary Sign Error]', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/create-checkout-session', async (req, res) => {
    const { userId, priceId, planName } = req.body;

    try {
        // Match pricing with configService.ts
        const amount = priceId === 'price_yearly' ? 14400 : 1500; // $144 (12 * 12) or $15
        const interval = priceId === 'price_yearly' ? 'year' : 'month';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: planName || 'Founder Pro Plan',
                        },
                        unit_amount: amount,
                        recurring: {
                            interval: interval,
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment-status?status=success&interval=${interval}`,
            cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment-status?status=cancel`,
            metadata: {
                userId: userId,
                interval: interval,
            },
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('[Stripe Error]', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[Payment Bridge] Running on port ${PORT}`));
