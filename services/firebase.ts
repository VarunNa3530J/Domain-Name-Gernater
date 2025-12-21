/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
    getAuth,
    signInWithPopup,
    signInWithCredential,
    GoogleAuthProvider
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Initialize GoogleAuth for Capacitor
if (Capacitor.isNativePlatform()) {
    GoogleAuth.initialize();
}

/**
 * Unified Login Logic:
 * Native platform use Capacitor Google Auth (native window).
 * Web platform use Firebase signInWithPopup.
 */
export const signInWithGoogle = async () => {
    console.log('[Auth] Starting Google Sign-In...');
    try {
        if (Capacitor.isNativePlatform()) {
            console.log('[Auth] Detected Native Platform, calling GoogleAuth.signIn()...');
            const user = await GoogleAuth.signIn();
            console.log('[Auth] Native Google Sign-In successful, idToken present:', !!user.authentication.idToken);

            if (!user.authentication.idToken) {
                throw new Error("No idToken received from Google Auth plugin.");
            }

            const credential = GoogleAuthProvider.credential(user.authentication.idToken);
            console.log('[Auth] Calling Firebase signInWithCredential...');
            const result = await signInWithCredential(auth, credential);
            console.log('[Auth] Firebase signInWithCredential successful for user:', result.user.uid);
            return result;
        } else {
            console.log('[Auth] Detected Web Platform, calling signInWithPopup...');
            const result = await signInWithPopup(auth, googleProvider);
            console.log('[Auth] Firebase signInWithPopup successful for user:', result.user.uid);
            return result;
        }
    } catch (e) {
        console.error('[Auth] Google Sign-In Error:', e);
        throw e;
    }
};
